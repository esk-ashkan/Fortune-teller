# gunicorn.conf.py
timeout = 120  # 2 minutes
workers = 2
worker_class = "gthread"
threads = 4
bind = "0.0.0.0:8080"
accesslog = "-"
errorlog = "-"
loglevel = "info"