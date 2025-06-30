module.exports = (req, res, next) => {
    if (req.path.startsWith('/engine')) {
      const id = +req.query.id;
      const status = req.query.status;
      if (status === 'started') {
        // random-ish numbers
        return res.jsonp({ velocity: 100 + Math.random() * 30, distance: 600 });
      }
      if (status === 'stopped') return res.status(204).end();
    }
    if (req.path.startsWith('/drive')) {
      if (Math.random() < 0.1) return res.status(500).end(); // 10 % fail
      return res.status(200).end();
    }
    next();
  };
  