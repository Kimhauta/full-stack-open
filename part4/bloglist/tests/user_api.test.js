const { test, after, beforeEach, describe } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const supertest = require("supertest");
const app = require("../app");
const User = require("../models/user");

const api = supertest(app);

describe("when there is initially one user in db", () => {
  beforeEach(async () => {
    await User.deleteMany({});
    const passwordHash = await bcrypt.hash("sekret", 10);
    const user = new User({
      username: "root",
      name: "Superuser",
      passwordHash,
    });
    await user.save();
  });

  test("creation succeeds with a fresh username", async () => {
    const usersAtStart = await User.find({});

    const newUser = {
      username: "mluukkai",
      name: "Matti Luukkainen",
      password: "password123",
    };

    await api
      .post("/api/users")
      .send(newUser)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const usersAtEnd = await User.find({});
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);
  });

  test("creation fails with 400 if username or password is invalid or taken", async () => {
    const usersAtStart = await User.find({});

    const invalidUsers = [
      { username: "ab", name: "Short User", password: "password123" },
      { username: "validuser", name: "Short Pass", password: "pw" },
      { username: "root", name: "Duplicate", password: "password123" },
    ];

    for (const badUser of invalidUsers) {
      const result = await api
        .post("/api/users")
        .send(badUser)
        .expect(400)
        .expect("Content-Type", /application\/json/);

      assert.ok(result.body.error);
    }

    const usersAtEnd = await User.find({});
    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

after(async () => {
  await mongoose.connection.close();
});
