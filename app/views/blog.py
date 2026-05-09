# -*- coding: utf-8 -*-
"""
@Time ： 2026/5/3 16:05
@Auth ： keevinzha
@File ：blog.py
@IDE ：PyCharm
"""
from flask import Blueprint, render_template, request
from app import db
from app.models import Article, Category, Tag, Series
from app.models.article_activity import ArticleActivity
from app import cache
from app.utils import render_markdown

blog = Blueprint('blog', __name__)


def get_sidebar():
    return Category.query.all(), Tag.query.all()


class SimplePagination:
    def __init__(self, items, page, per_page, total):
        self.items = items
        self.page = page
        self.per_page = per_page
        self.total = total
        self.pages = max(1, (total + per_page - 1) // per_page)
        self.has_prev = page > 1
        self.has_next = page < self.pages
        self.prev_num = page - 1
        self.next_num = page + 1

    def iter_pages(self, left_edge=1, right_edge=1, left_current=2, right_current=2):
        last = 0
        for num in range(1, self.pages + 1):
            if (num <= left_edge
                    or (self.page - left_current - 1 < num < self.page + right_current)
                    or num > self.pages - right_edge):
                if last + 1 != num:
                    yield None
                yield num
                last = num


@blog.route('/')
@cache.cached(timeout=300, query_string=True)
def index():
    page = request.args.get('page', 1, type=int)
    per_page = 10

    standalone = Article.query.filter_by(is_published=True, series_id=None).all()
    all_series_list = Series.query.filter_by(is_recommended=True).all()

    items = sorted(
        [(a.created_at, a) for a in standalone] + [(s.created_at, s) for s in all_series_list],
        key=lambda x: x[0],
        reverse=True
    )
    items = [obj for _, obj in items]

    total = len(items)
    offset = (page - 1) * per_page
    page_items = items[offset:offset + per_page]

    pagination = SimplePagination(page_items, page, per_page, total)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=page_items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags)


@blog.route('/<slug>')
def article_detail(slug):
    article = Article.query.filter_by(slug=slug, is_published=True).first_or_404()
    article.view_count += 1
    ArticleActivity.record(article.id)
    db.session.commit()
    content_html, toc_html = render_markdown(article.content)
    if article.series:
        series_articles = article.series.articles.filter_by(is_published=True)\
            .order_by(Article.series_order.asc()).all()
        idx = next((i for i, a in enumerate(series_articles) if a.id == article.id), None)
        prev_post = series_articles[idx - 1] if idx is not None and idx > 0 else None
        next_post = series_articles[idx + 1] if idx is not None and idx < len(series_articles) - 1 else None
    else:
        prev_post = Article.query.filter(
            Article.is_published==True,
            Article.created_at < article.created_at
        ).order_by(Article.created_at.desc()).first()
        next_post = Article.query.filter(
            Article.is_published==True,
            Article.created_at > article.created_at
        ).order_by(Article.created_at.asc()).first()
    categories, tags = get_sidebar()
    theme = article.theme or (article.series.theme if article.series else None)
    theme_templates = {
        'intelligent_investor': 'post_detail_intelligent_investor.html',
    }
    template = theme_templates.get(theme, 'post_detail.html')
    return render_template(template,
                           post=article,
                           content_html=content_html,
                           toc_html=toc_html,
                           prev_post=prev_post,
                           next_post=next_post,
                           all_categories=categories,
                           all_tags=tags)


@blog.route('/category/<slug>')
@cache.cached(timeout=300, query_string=True)
def category(slug):
    cat = Category.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = cat.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_category=cat)


@blog.route('/tag/<slug>')
@cache.cached(timeout=300, query_string=True)
def tag(slug):
    t = Tag.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = t.articles.filter_by(is_published=True)\
        .order_by(Article.created_at.desc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_tag=t.name)


@blog.route('/series/<slug>')
@cache.cached(timeout=300, query_string=True)
def series(slug):
    s = Series.query.filter_by(slug=slug).first_or_404()
    page = request.args.get('page', 1, type=int)
    pagination = s.articles.filter_by(is_published=True)\
        .order_by(Article.series_order.asc())\
        .paginate(page=page, per_page=10)
    categories, tags = get_sidebar()
    return render_template('post_list.html',
                           posts=pagination.items,
                           pagination=pagination,
                           all_categories=categories,
                           all_tags=tags,
                           current_series=s)