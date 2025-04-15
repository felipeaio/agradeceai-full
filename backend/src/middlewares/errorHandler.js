const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
      error: err.message || 'Erro no servidor',
      code: err.status || 500
  });
};

export default errorHandler;