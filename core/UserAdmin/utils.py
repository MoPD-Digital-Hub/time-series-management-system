import jwt, time

METABASE_SITE_URL = "http://196.188.240.72:3000"
METABASE_SECRET_KEY = "223ab4346249fdaaadc730684fa741831ab9ce73456f1e5c72b6fe23d0740a5b"

def generate_metabase_iframe_url(dashboard_id):
    payload = {
        "resource": {"dashboard": dashboard_id},
        "params": {},
        "exp": round(time.time()) + (10 * 60)  # expires in 10 minutes
    }

    token = jwt.encode(payload, METABASE_SECRET_KEY, algorithm="HS256")

    iframe_url = f"{METABASE_SITE_URL}/embed/dashboard/{token}#bordered=true&titled=true"
    return iframe_url