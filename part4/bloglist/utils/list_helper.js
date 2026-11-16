const dummy = () => 1;

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  return blogs.reduce((favorite, current) =>
    current.likes > favorite.likes ? current : favorite,
  );
};

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const countsByAuthor = {};
  for (const blog of blogs) {
    countsByAuthor[blog.author] = (countsByAuthor[blog.author] || 0) + 1;
  }

  let topAuthor = null;
  let maxBlogs = 0;

  for (const [author, count] of Object.entries(countsByAuthor)) {
    if (count > maxBlogs) {
      topAuthor = author;
      maxBlogs = count;
    }
  }

  return {
    author: topAuthor,
    blogs: maxBlogs,
  };
};

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null;
  }

  const likesByAuthor = {};
  for (const blog of blogs) {
    likesByAuthor[blog.author] = (likesByAuthor[blog.author] || 0) + blog.likes;
  }

  let topAuthor = null;
  let maxLikes = -1;

  for (const [author, likes] of Object.entries(likesByAuthor)) {
    if (likes > maxLikes) {
      topAuthor = author;
      maxLikes = likes;
    }
  }

  return {
    author: topAuthor,
    likes: maxLikes,
  };
};

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
};
