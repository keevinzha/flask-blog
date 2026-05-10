# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：main.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, jsonify, url_for, request, Response
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


@main.route('/sitemap.xml')
def sitemap():
    base = request.host_url.rstrip('/')

    urls = []

    # 静态页面
    static_pages = [
        ('/', '1.0', 'daily'),
        ('/blog', '0.9', 'daily'),
        ('/about', '0.8', 'monthly'),
        ('/books', '0.7', 'monthly'),
    ]
    for path, priority, changefreq in static_pages:
        urls.append({
            'loc': base + path,
            'priority': priority,
            'changefreq': changefreq,
            'lastmod': None,
        })

    # 已发布文章
    articles = Article.query.filter_by(is_published=True).order_by(Article.updated_at.desc()).all()
    for article in articles:
        urls.append({
            'loc': base + url_for('blog.article_detail', slug=article.slug),
            'priority': '0.8',
            'changefreq': 'weekly',
            'lastmod': article.updated_at.strftime('%Y-%m-%d') if article.updated_at else None,
        })

    # 分类页面
    categories = Category.query.all()
    for cat in categories:
        urls.append({
            'loc': base + url_for('blog.category', slug=cat.slug),
            'priority': '0.6',
            'changefreq': 'weekly',
            'lastmod': None,
        })

    # 标签页面
    tags = Tag.query.all()
    for tag in tags:
        urls.append({
            'loc': base + url_for('blog.tag', slug=tag.slug),
            'priority': '0.5',
            'changefreq': 'weekly',
            'lastmod': None,
        })

    # 系列页面
    all_series = Series.query.all()
    for s in all_series:
        urls.append({
            'loc': base + url_for('blog.series', slug=s.slug),
            'priority': '0.7',
            'changefreq': 'weekly',
            'lastmod': s.created_at.strftime('%Y-%m-%d') if s.created_at else None,
        })

    xml_lines = ['<?xml version="1.0" encoding="UTF-8"?>',
                 '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        xml_lines.append('  <url>')
        xml_lines.append(f'    <loc>{u["loc"]}</loc>')
        if u['lastmod']:
            xml_lines.append(f'    <lastmod>{u["lastmod"]}</lastmod>')
        xml_lines.append(f'    <changefreq>{u["changefreq"]}</changefreq>')
        xml_lines.append(f'    <priority>{u["priority"]}</priority>')
        xml_lines.append('  </url>')
    xml_lines.append('</urlset>')

    return Response('\n'.join(xml_lines), mimetype='application/xml')