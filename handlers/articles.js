const fs = require('fs');
const path = require('path');

let articles = [];

const articlesFilePath = path.join(__dirname, '../articles.json');

function loadArticles(cb) {
  fs.readFile(articlesFilePath, (err, data) => {
    if (err) return cb(err);
    articles = JSON.parse(data);
    cb(null);
  });
}

function saveArticles(cb) {
  fs.writeFile(articlesFilePath, JSON.stringify(articles, null, 2), (err) => {
    if (err) return cb(err);
    cb(null);
  });
}

function readAllArticles(req, res, payload, cb) {
  cb(null, articles);
}

function readArticleById(req, res, payload, cb) {
  const articleId = payload.id;

  if (!articleId) {
    return cb({ code: 400, message: 'Article id is required' });
  }

  const article = articles.find(a => a.id == articleId);

  if (!article) {
    return cb({ code: 404, message: 'Article not found' });
  }

  cb(null, article);
}

function createArticle(req, res, payload, cb) {
  const { title, text, author } = payload;

  if (!title || !text || !author) {
    return cb({ code: 400, message: 'Missing required fields: title, text, and author' });
  }

  const newId = articles.length > 0 ? articles[articles.length - 1].id + 1 : 1;

  const newArticle = {
    id: newId,
    title: title,
    text: text,
    date: Date.now(),
    author: author,
    comments: []
  };

  articles.push(newArticle);

  saveArticles((err) => {
    if (err) {
      return cb({ code: 500, message: 'Failed to save article' });
    }

    cb(null, newArticle);
  });
}

function updateArticle(req, res, payload, cb) {
  const { id, title, text, author } = payload;

  if (!id) {
    return cb({ code: 400, message: 'Article id is required' });
  }

  const article = articles.find(a => a.id == id);

  if (!article) {
    return cb({ code: 404, message: 'Article not found' });
  }

  if (title) article.title = title;
  if (text) article.text = text;
  if (author) article.author = author;

  saveArticles((err) => {
    if (err) {
      return cb({ code: 500, message: 'Failed to update article' });
    }

    cb(null, article);
  });
}

function deleteArticle(req, res, payload, cb) {
  const { id } = payload;

  if (!id) {
    return cb({ code: 400, message: 'Article id is required' });
  }

  const articleIndex = articles.findIndex(a => a.id == id);

  if (articleIndex === -1) {
    return cb({ code: 404, message: 'Article not found' });
  }

  const deletedArticle = articles.splice(articleIndex, 1)[0];

  saveArticles((err) => {
    if (err) {
      return cb({ code: 500, message: 'Failed to delete article' });
    }

    cb(null, { message: 'Article deleted successfully', article: deletedArticle });
  });
}

module.exports = {
  readAllArticles,
  readArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
  loadArticles
};
