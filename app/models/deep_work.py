from app import db
from datetime import date, timedelta


class DeepWorkSession(db.Model):
    __tablename__ = 'deep_work_sessions'

    id = db.Column(db.Integer, primary_key=True)
    session_date = db.Column(db.Date, nullable=False, default=date.today)
    is_breakthrough = db.Column(db.Boolean, default=False, nullable=False)
    seed = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.now())


def build_weeks_json(year=None, num_weeks=None):
    """Return list of week dicts for template: [{label, current, sessions:[{bt,seed}]}]

    num_weeks: if set, only return the most recent N weeks (always includes current week).
    """
    if year is None:
        year = date.today().year

    today = date.today()
    current_iso = today.isocalendar()  # (year, week, weekday)

    sessions = (
        DeepWorkSession.query
        .filter(db.func.year(DeepWorkSession.session_date) == year)
        .order_by(DeepWorkSession.session_date, DeepWorkSession.id)
        .all()
    )

    weeks_map: dict[tuple, list] = {}
    for s in sessions:
        iso = s.session_date.isocalendar()
        key = (iso[0], iso[1])
        weeks_map.setdefault(key, []).append(s)

    current_key = (current_iso[0], current_iso[1])
    weeks_map.setdefault(current_key, [])

    def week_label(iso_year, iso_week):
        mon = date.fromisocalendar(iso_year, iso_week, 1)
        sun = date.fromisocalendar(iso_year, iso_week, 7)
        return f"W{iso_week:02d} · {mon.strftime('%m/%d')}–{sun.strftime('%m/%d')}"

    if num_weeks is not None:
        # Generate exactly num_weeks consecutive weeks ending at current week
        keys = []
        for i in range(num_weeks - 1, -1, -1):
            d = today - timedelta(weeks=i)
            iso = d.isocalendar()
            keys.append((iso[0], iso[1]))
    else:
        keys = sorted(weeks_map.keys())

    result = []
    for key in keys:
        iso_year, iso_week = key
        is_current = (iso_year == current_iso[0] and iso_week == current_iso[1])
        result.append({
            'label': week_label(iso_year, iso_week),
            'current': is_current,
            'sessions': [
                {'bt': s.is_breakthrough, 'seed': s.seed}
                for s in weeks_map.get(key, [])
            ],
        })

    return result
