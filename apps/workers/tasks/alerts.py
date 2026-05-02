import resend
import os
from datetime import datetime, timedelta, timezone
from celery_app import app
from db.supabase import supabase

resend.api_key = os.getenv("RESEND_API_KEY")

# ─────────────────────────────────
# TASK PRINCIPALE — Digest quotidien
# ─────────────────────────────────
@app.task(name="tasks.alerts.send_daily_digest")
def send_daily_digest():
    """Envoyé chaque matin à 8h00 à tous les abonnés actifs."""

    subscribers = supabase.table("alert_subscribers")\
        .select("*")\
        .eq("is_active", True)\
        .eq("alert_mode", "digest")\
        .execute().data

    if not subscribers:
        return {"status": "no_subscribers"}

    results = []
    for subscriber in subscribers:
        result = _send_digest_to_subscriber(subscriber)
        results.append(result)

    return {"status": "done", "sent": len(results), "details": results}


def _send_digest_to_subscriber(subscriber: dict):
    """Prépare et envoie le digest à un abonné."""

    # Jobs HIGH des dernières 24h pas encore envoyés à cet abonné
    yesterday = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()

    # Récupérer les jobs déjà envoyés
    sent_ids = supabase.table("alert_jobs_sent")\
        .select("job_id")\
        .eq("subscriber_id", subscriber["id"])\
        .execute().data
    sent_job_ids = [s["job_id"] for s in sent_ids]

    # Récupérer les nouveaux jobs HIGH
    query = supabase.table("jobs")\
        .select("*")\
        .eq("relevance_tier", "HIGH")\
        .eq("is_active", True)\
        .eq("is_duplicate", False)\
        .gte("created_at", yesterday)\
        .order("relevance_score", desc=True)\
        .limit(10)\
        .execute()

    new_jobs = [j for j in query.data if j["id"] not in sent_job_ids]

    if not new_jobs:
        return {"subscriber": subscriber["email"], "status": "no_new_jobs"}

    # Générer et envoyer l'email
    html_content = _build_digest_html(subscriber, new_jobs)

    try:
        params = {
            "from": os.getenv("ALERT_FROM_EMAIL"),
            "to": subscriber["email"],
            "subject": f"🟢 [{len(new_jobs)} offres Excel HIGH] · Exceliot · {datetime.now().strftime('%d %b %Y')}",
            "html": html_content
        }
        response = resend.Emails.send(params)

        # Logger les jobs envoyés
        for job in new_jobs:
            supabase.table("alert_jobs_sent").insert({
                "subscriber_id": subscriber["id"],
                "job_id": job["id"]
            }).execute()

        # Mettre à jour last_sent_at
        supabase.table("alert_subscribers")\
            .update({"last_sent_at": datetime.now(timezone.utc).isoformat()})\
            .eq("id", subscriber["id"])\
            .execute()

        # Logger l'envoi
        supabase.table("alert_emails_sent").insert({
            "subscriber_id": subscriber["id"],
            "jobs_included": [j["id"] for j in new_jobs],
            "resend_message_id": response.get("id") if isinstance(response, dict) else str(response),
            "status": "sent"
        }).execute()

        return {"subscriber": subscriber["email"], "status": "sent", "jobs": len(new_jobs)}
    except Exception as e:
        return {"subscriber": subscriber["email"], "status": "error", "error": str(e)}


def _build_digest_html(subscriber: dict, jobs: list) -> str:
    """Génère le HTML de l'email digest."""

    first_name = subscriber.get("first_name", "")
    jobs_html = ""

    for job in jobs:
        score = job.get("relevance_score", 0)
        skills = ", ".join(job.get("key_excel_skills", [])[:4]) if job.get("key_excel_skills") else "—"
        salary = f"{job.get('salary_min', '')}–{job.get('salary_max', '')}€" \
                 if job.get("salary_min") else "Non communiqué"
        remote = {"full_remote": "🏠 Full Remote", "hybrid": "🔄 Hybride",
                  "on_site": "🏢 Sur site"}.get(job.get("remote_policy"), "—")

        jobs_html += f"""
        <div style="border-left: 4px solid #22c55e; padding: 16px;
                    margin-bottom: 16px; background: #f9fafb; border-radius: 4px;">
          <div style="font-size: 12px; color: #22c55e; font-weight: bold;">
            🟢 SCORE {score}/100
          </div>
          <div style="font-size: 18px; font-weight: bold; margin: 8px 0; color: #111;">
            {job.get('title', '—')}
          </div>
          <div style="color: #555; margin-bottom: 8px;">
            {job.get('company', '—')} · {job.get('location', '—')} · {job.get('contract_type', '—')}
          </div>
          <div style="font-size: 13px; color: #777; margin-bottom: 12px;">
            💰 {salary} &nbsp;·&nbsp; {remote}
          </div>
          <div style="font-size: 12px; color: #444; margin-bottom: 12px;">
            <strong>Skills :</strong> {skills}
          </div>
          <a href="{job.get('url', '#')}"
             style="background: #16a34a; color: white; padding: 8px 16px;
                    border-radius: 4px; text-decoration: none; font-size: 13px;">
            Voir l'offre →
          </a>
        </div>
        """

    unsubscribe_token = subscriber.get('unsubscribe_token', 'default')
    unsubscribe_url = f"https://exceliot.vercel.app/unsubscribe?token={unsubscribe_token}"

    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px;
                margin: 0 auto; padding: 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #16a34a; font-size: 24px;">EXCELIOT</h1>
        <p style="color: #555;">Job Digest · {datetime.now().strftime('%d %B %Y')}</p>
      </div>

      <p style="color: #333;">Bonjour {first_name},</p>
      <p style="color: #333;">
        <strong>{len(jobs)} offres Excel HIGH RELEVANCE</strong>
        détectées depuis hier :
      </p>

      {jobs_html}

      <div style="text-align: center; margin-top: 32px;">
        <a href="https://exceliot.vercel.app"
           style="background: #16a34a; color: white; padding: 12px 24px;
                  border-radius: 4px; text-decoration: none; font-weight: bold;">
          Voir toutes les offres →
        </a>
      </div>

      <div style="text-align: center; margin-top: 24px;
                  font-size: 11px; color: #aaa;">
        <a href="{unsubscribe_url}" style="color: #aaa;">Se désabonner</a>
        &nbsp;·&nbsp; Exceliot by votre cabinet
      </div>
    </div>
    """
