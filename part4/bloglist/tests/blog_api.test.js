const { test, after, beforeEach, describe } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require("../models/user");
const helper = require("./test_helper");

const api = supertest(app);

let token;

beforeEach(async () => {
  await Blog.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("sekret", 10);
  const user = new User({
    username: "root",
    name: "Superuser",
    passwordHash,
  });
  await user.save();

  const userForToken = {
    username: user.username,
    id: user._id,
  };
  token = jwt.sign(userForToken, process.env.SECRET, { expiresIn: 60 * 60 });

  const initialBlogsWithUser = helper.initialBlogs.map((blog) => ({
    ...blog,
    user: user._id,
  }));

  const insertedBlogs = await Blog.insertMany(initialBlogsWithUser);
  user.blogs = insertedBlogs.map((blog) => blog._id);
  await user.save();
});

describe("when there is initially some blogs saved", () => {
  test("blogs are returned as json", async () => {
    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");
    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test("unique identifier property of blog posts is named id", async () => {
    const response = await api.get("/api/blogs");
    const firstBlog = response.body[0];

    assert.ok(firstBlog.id);
    assert.strictEqual(firstBlog._id, undefined);
  });
});

describe("addition of a new blog", () => {
  test("succeeds with valid data and a valid token", async () => {
    const newBlog = {
      title: "Canonical string reduction",
      author: "Edsger W. Dijkstra",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    const titles = blogsAtEnd.map((b) => b.title);
    assert(titles.includes("Canonical string reduction"));
  });

  test("defaults likes property to 0 if missing from request", async () => {
    const newBlog = {
      title: "First class tests",
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/05/05/TestDefinitions.htmll",
    };

    const response = await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, 0);
  });

  test("fails with status code 400 if title or url is missing", async () => {
    const blogWithoutTitle = {
      author: "Robert C. Martin",
      url: "http://blog.cleancoder.com/uncle-bob/2017/03/03/TDD-Harms-Architecture.html",
      likes: 4,
    };

    const blogWithoutUrl = {
      title: "TDD harms architecture",
      author: "Robert C. Martin",
      likes: 4,
    };

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(blogWithoutTitle)
      .expect(400);

    await api
      .post("/api/blogs")
      .set("Authorization", `Bearer ${token}`)
      .send(blogWithoutUrl)
      .expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });

  test("fails with status code 401 Unauthorized if token is not provided", async () => {
    const newBlog = {
      title: "Unauthorized blog post",
      author: "Anonymous",
      url: "https://example.com/unauth",
      likes: 1,
    };

    await api.post("/api/blogs").send(newBlog).expect(401);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });
});

describe("deletion of a blog", () => {
  test("succeeds with status code 204 if id is valid and requested by creator", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api
      .delete(`/api/blogs/${blogToDelete.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);

    const titles = blogsAtEnd.map((b) => b.title);
    assert(!titles.includes(blogToDelete.title));
  });

  test("fails with status code 401 if token is missing", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id}`).expect(401);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });

  test("fails with status code 400 if id is invalid", async () => {
    const invalidId = "5a3d5da59070081a82a3445";

    await api
      .delete(`/api/blogs/${invalidId}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(400);
  });
});

describe("updating a blog", () => {
  test("succeeds in updating likes for a valid id", async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedData = {
      ...blogToUpdate,
      likes: blogToUpdate.likes + 10,
    };

    const response = await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedData)
      .expect(200)
      .expect("Content-Type", /application\/json/);

    assert.strictEqual(response.body.likes, blogToUpdate.likes + 10);

    const blogsAtEnd = await helper.blogsInDb();
    const updatedInDb = blogsAtEnd.find((b) => b.id === blogToUpdate.id);
    assert.strictEqual(updatedInDb.likes, blogToUpdate.likes + 10);
  });

  test("fails with status code 404 if blog does not exist", async () => {
    const validNonexistingId = await helper.nonExistingId();

    await api
      .put(`/api/blogs/${validNonexistingId}`)
      .send({ title: "Ghost blog", url: "https://example.com", likes: 1 })
      .expect(404);
  });

  test("fails with status code 400 if id is invalid", async () => {
    const invalidId = "5a3d5da59070081a82a3445";

    await api
      .put(`/api/blogs/${invalidId}`)
      .send({ title: "Invalid", url: "https://example.com", likes: 1 })
      .expect(400);
  });
});

after(async () => {
  await mongoose.connection.close();
});
