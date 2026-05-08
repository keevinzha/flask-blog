from app import db
from datetime import date


class ArticleActivity(db.Model):
    __tablename__ = 'article_activities'

    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey('articles.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    view_count = db.Column(db.Integer, default=0, nullable=False)

    __table_args__ = (
        db.UniqueConstraint('article_id', 'date', name='uq_article_date'),
    )

    @staticmethod
    def record(article_id):
        """记录今天对该文章的一次阅读，不存在则新建，已存在则累加。"""
        today = date.today()
        row = ArticleActivity.query.filter_by(article_id=article_id, date=today).first()
        if row:
            row.view_count += 1
        else:
            db.session.add(ArticleActivity(article_id=article_id, date=today, view_count=1))

    @staticmethod
    def today_total():
        """返回今日全站总阅读量。"""
        from sqlalchemy import func
        result = db.session.query(func.sum(ArticleActivity.view_count))\
            .filter(ArticleActivity.date == date.today()).scalar()
        return result or 0
