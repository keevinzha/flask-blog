# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 15:56
@Auth ： keevinzha
@File ：series.py
@IDE ：PyCharm
"""
from app import db

class Series(db.Model):
    __tablename__ = 'series'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(128), unique=True, nullable=False)
    slug = db.Column(db.String(128), unique=True, nullable=False)
    description = db.Column(db.Text)
    cover = db.Column(db.String(256))
    theme = db.Column(db.String(64), nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.now())
    is_recommended = db.Column(db.Boolean, default=False)

    articles = db.relationship('Article', backref='series', lazy='dynamic',
                               order_by='Article.series_order')