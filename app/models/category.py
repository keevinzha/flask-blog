# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 15:50
@Auth ： keevinzha
@File ：category.py.py
@IDE ：PyCharm
"""
from app import db

class Category(db.Model):
    __tablename__ = 'categories'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(64), unique=True, nullable=False)
    slug = db.Column(db.String(64), unique=True, nullable=False)
    description = db.Column(db.String(256))
    created_at = db.Column(db.DateTime, default=db.func.now())

    articles = db.relationship('Article', backref='category', lazy='dynamic')