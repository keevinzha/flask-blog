# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：main.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, jsonify, url_for
from app.models import Article, Category, Tag, Series
from app import db, cache
from app.models.about import Book, Project
from app.models.article_activity import ArticleActivity
from datetime import timedelta, date

main = Blueprint('main', __name__)


@main.route('/')
@cache.cached(timeout=300)
def index():
    recommended = Article.query.filter_by(
        is_published=True,
        is_recommended=True
    ).all()
    all_series = Series.query.filter_by(is_recommended=True).all()

    items = sorted(
        [(a.created_at, a) for a in recommended] + [(s.created_at, s) for s in all_series],
        key=lambda x: x[0],
        reverse=True
    )
    recent = [obj for _, obj in items][:10]

    categories = Category.query.all()
    tags = Tag.query.all()

    return render_template('post_list.html',
                           posts=recent,
                           pagination=None,
                           all_categories=categories,
                           all_tags=tags)


@main.route('/search-data.json')
def search_data():
    posts = Article.query.filter_by(is_published=True).all()
    data = [
        {
            'title': p.title,
            'href': url_for('blog.article_detail', slug=p.slug),
            'content': p.summary or '',
            'section': p.category.name if p.category else '',
        }
        for p in posts
    ]
    return jsonify(data)


@main.route('/about')
def about():
    books = Book.query.filter_by(is_reading=True).all()
    read_books = Book.query.filter_by(is_reading=False).order_by(Book.created_at.desc()).all()
    projects = Project.query.filter_by(is_active=True).all()

    articles = Article.query.filter_by(is_published=True)\
        .order_by(Article.created_at.desc()).all()

    one_year_ago = date.today() - timedelta(days=365)
    activities = db.session.query(
        ArticleActivity.date,
        db.func.sum(ArticleActivity.edit_count)
    ).join(Article, Article.id == ArticleActivity.article_id)\
     .filter(
         Article.is_published == True,
         ArticleActivity.date >= one_year_ago,
         ArticleActivity.edit_count > 0
     ).group_by(ArticleActivity.date).all()

    heatmap_data = {str(d): int(cnt) for d, cnt in activities}

    return render_template('about.html',
                           books=books,
                           read_books=read_books,
                           projects=projects,
                           articles=articles,
                           heatmap_data=heatmap_data)


@main.route('/magpie-murders')
def magpie_murders():
    return render_template('magpie_murders.html')



@main.route('/books')
def read_books():
    books = Book.query.filter_by(is_reading=False).order_by(Book.created_at.desc()).all()
    return render_template('read_books.html', books=books)