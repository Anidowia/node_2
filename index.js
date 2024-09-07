const http = require('http');
const fs = require('fs');
const path = require('path');
const hostname = '127.0.0.1';
const port = 3000;

const articleHandlers = require('./handlers/articles');
const commentHandlers = require('./handlers/comments');

let articles = [];
const logFilePath = path.join(__dirname, 'server.log');

function logRequest(req, payload) {
  const logEntry = `
  ----------------------------------------
  Date: ${new Date().toLocaleString()}
  URL: ${req.url}
  Method: ${req.method}
  Payload: ${JSON.stringify(payload, null, 2)}
  ----------------------------------------
  `;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to write log:', err);
    }
  });
}

function getHandler(url) {
  return handlers[url] || notFound;
}

const handlers = {
  '/api/articles/readall': articleHandlers.readAllArticles,
  '/api/articles/read': articleHandlers.readArticleById,
  '/api/articles/create': articleHandlers.createArticle,
  '/api/articles/update': articleHandlers.updateArticle,
  '/api/articles/delete': articleHandlers.deleteArticle,
  '/api/comments/create': commentHandlers.createComment,
  '/api/comments/delete': commentHandlers.deleteComment
};

const server = http.createServer((req, res) => {

  parseBodyJson(req, (err, payload) => {

    logRequest(req, payload);

    const handler = getHandler(req.url);

    handler(req, res, payload, (err, result) => {
      if (err) {
        res.statusCode = err.code;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(err));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    });
  });
});

function parseBodyJson(req, cb) {
  let body = [];

  req.on('data', function (chunk) {
    body.push(chunk);
  }).on('end', function () {
    body = Buffer.concat(body).toString();
    if (body) {
      try {
        let params = JSON.parse(body);
        cb(null, params);
      } catch (err) {
        cb({ code: 400, message: 'Invalid JSON' });
      }
    } else {
      cb(null, {});
    }
  });
}

articleHandlers.loadArticles((err) => {
  if (err) {
    console.error('Failed to load articles:', err);
    process.exit(1);
  }

  commentHandlers.loadArticles((err) => {
    if (err) {
      console.error('Failed to load articles for comments:', err);
      process.exit(1);
    }

    server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
    });
  });
});
