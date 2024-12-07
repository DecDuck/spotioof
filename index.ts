import { PrismaClient, Record, User } from "@prisma/client";
import express from "express";
import bodyParser from "body-parser";
import * as bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const app = express();
const prisma = new PrismaClient();

// Totally legitimate session store.
// No issues here.
const sessions: { [key: string]: string } = {};

app.use(bodyParser.json());

app.post("/register", async (req, res) => {
  const body = req.body;
  const username = body.username;
  const password = body.password;

  if (!username || typeof username !== "string") {
    res.status(400).send({ message: "Invalid or missing username" });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).send({ message: "Invalid or missing password" });
    return;
  }

  const passwordHash = bcrypt.hashSync(password);
  try {
    await prisma.user.create({
      data: {
        username,
        password: passwordHash,
      },
    });
  } catch (e) {
    res.status(400).send({ message: "Please choose a different username." });
    return;
  }

  res.status(200).send({});
});

app.post("/signin", async (req, res) => {
  const body = req.body;
  const username = body.username;
  const password = body.password;

  if (!username || typeof username !== "string") {
    res.status(400).send({ message: "Invalid or missing username" });
    return;
  }

  if (!password || typeof password !== "string") {
    res.status(400).send({ message: "Invalid or missing password" });
    return;
  }

  let potentialUsers: Array<User>;
  try {
    // RAW SQL
    potentialUsers =
      await prisma.$queryRaw`SELECT * FROM Users WHERE username = ${username}`;
  } catch (e) {
    res.status(403).send({ message: "Invalid username or password" });
    return;
  }

  if (potentialUsers.length != 1) {
    res.status(403).send({ message: "Invalid username or password" });
    return;
  }

  const user = potentialUsers[0];
  const hashPassword = user.password;
  if (!bcrypt.compareSync(password, hashPassword)) {
    res.status(403).send({ message: "Invalid username or password" });
    return;
  }

  const session = Math.floor(Math.random() * 10000000).toString();
  sessions[session] = user.id;

  res.status(200).send({ token: session });
  return;
});

app.get("/tracks", async (req, res) => {
  /*
    const token = req.query.token;
    if (!token) {
      res.status(403).send({ message: "Please provide token." });
      return;
    }
      */

  // Limits sort to 'asc' or 'desc'
  const sort = ["ASC", "DESC"].find((e) => e === req.query.sort) ?? "ASC";

  // :sparkles: unsafe query :sparkles:
  const tracks = await prisma.$queryRawUnsafe(
    `SELECT * FROM Record ORDER BY trackName ${sort}`
  );

  res.status(200).send(tracks);
  return;
});

app.get("/tracks/:id", async (req, res) => {
  /*
    const token = req.query.token;
    if (!token) {
      res.status(403).send({ message: "Please provide token." });
      return;
    }
      */

  const id = req.params.id;

  const [song] =
    (await prisma.$queryRaw`SELECT * FROM Record WHERE id = ${id}`) as Array<Record>;
  if (!song) {
    res.status(404).send({ message: "Invalid ID" });
  }

  const baseDir = path.join(".", "library");
  const audioPath = path.join(baseDir, song.filename);

  // Send audio file
  const readStream = fs.createReadStream(audioPath);
  res.status(200);
  readStream.pipe(res);

  // Wait until finished transfering
  await new Promise((resolve) => readStream.on("end", resolve));
});

app.use(express.static("public"));

// Don't put any routes past this point
app.use((_, res) => {
  res.setHeader("Content-Type", "application/json");
  res.status(404).send({ status: 404, message: "Not Found" });
});
app.listen(3000, () => {
  console.log(`Server listening :3000`);
});
