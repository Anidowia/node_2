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

function createComment(req, res, payload, cb) {
  const { articleId, text, author } = payload;

  if (!articleId || !text || !author) {
    return cb({ code: 400, message: 'Missing required fields: articleId, text, and author' });
  }

  const article = articles.find(a => a.id == articleId);

  if (!article) {
    return cb({ code: 404, message: 'Article not found' });
  }

  const newCommentId = article.comments.length > 0
    ? article.comments[article.comments.length - 1].id + 1
    : 1;

  const newComment = {
    id: newCommentId,
    articleId: articleId,
    text: text,
    date: Date.now(),
    author: author
  };

  article.comments.push(newComment);

  saveArticles((err) => {
    if (err) {
      return cb({ code: 500, message: 'Failed to save comment' });
    }

    cb(null, newComment);
  });
}

function deleteComment(req, res, payload, cb) {
  const { id } = payload;

  if (!id) {
    return cb({ code: 400, message: 'Comment id is required' });
  }

  let commentFound = false;

  for (let article of articles) {
    const commentIndex = article.comments.findIndex(c => c.id == id);

    if (commentIndex !== -1) {
      const deletedComment = article.comments.splice(commentIndex, 1)[0];
      commentFound = true;

      saveArticles((err) => {
        if (err) {
          return cb({ code: 500, message: 'Failed to delete comment' });
        }

        return cb(null, { message: 'Comment deleted successfully', comment: deletedComment });
      });

      break;
    }
  }

  if (!commentFound) {
    return cb({ code: 404, message: 'Comment not found' });
  }
}

module.exports = {
  createComment,
  deleteComment,
  loadArticles
};
