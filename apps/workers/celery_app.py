import os
from celery import Celery
from celery.schedules import crontab
from dotenv import load_dotenv

load_dotenv()

redis_url = os.getenv("REDIS_URL", "redis://redis:6379/0")

app = Celery(
    "exceliot_workers",
    broker=redis_url,
    backend=redis_url,
    include=['tasks.scrape_tasks', 'tasks.nlp_tasks', 'tasks.alerts']
)

# Configure Celery Beat schedule
app.conf.beat_schedule = {
    'scrape-adzuna-every-6-hours': {
        'task': 'tasks.scrape_tasks.run_adzuna_scraper',
        'schedule': crontab(minute=0, hour='*/6'),
    },
    'score-jobs-every-15-mins': {
        'task': 'tasks.nlp_tasks.run_nlp_scoring',
        'schedule': crontab(minute='*/15'),
    },
    'daily-digest-8am': {
        'task': 'tasks.alerts.send_daily_digest',
        'schedule': crontab(minute=0, hour=8),
    },
}
app.conf.timezone = 'UTC'

@app.task
def dummy_task():
    return "Worker is ready 🟢"
