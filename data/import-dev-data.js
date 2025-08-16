const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const fs = require("fs");
const { ObjectId } = require("mongodb");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB).then(() => console.log("DB connected..."));

// Read JSON files
const readJSON = (file) =>
  JSON.parse(fs.readFileSync(`${__dirname}/${file}.json`, "utf-8"));

const messages = readJSON("messages");
const users = readJSON("users");
const conversations = readJSON("conversations");

// Enhanced normalizeForMongo function
function normalizeForMongo(data, options = {}) {
  const {
    idMap = new Map(),
    preserveOriginal = false,
    convertMessageIds = false,
  } = options;

  const createObjectId = (id) => {
    if (!id) return new ObjectId();
    if (idMap.has(id)) return idMap.get(id);
    const oid = new ObjectId();
    idMap.set(id, oid);
    return oid;
  };

  const normalize = (item) => {
    if (Array.isArray(item)) return item.map(normalize);
    if (!item || typeof item !== "object") return item;

    const normalized = { ...item };

    // Handle IDs
    if (normalized._id) {
      if (preserveOriginal) normalized.original_id = normalized._id;
      normalized._id = createObjectId(normalized._id);
    }

    // Normalize references
    const referenceFields = {
      sender: true,
      participants: true,
      conversation: true,
      user: true,
      lastMessage: convertMessageIds,
    };

    Object.keys(normalized).forEach((key) => {
      if (referenceFields[key]) {
        normalized[key] = Array.isArray(normalized[key])
          ? normalized[key].map(createObjectId)
          : createObjectId(normalized[key]);
      }
    });

    return normalized;
  };

  const normalizedData = normalize(data);
  return { normalizedData, idMap };
}

const importData = async () => {
  try {
    // 1. Import users with hashed passwords
    const usersWithPasswords = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password || "test1234", 12),
        passwordConfirm: undefined,
      }))
    );

    const { normalizedData: normalizedUsers, idMap: usersIdMap } =
      normalizeForMongo(usersWithPasswords, { preserveOriginal: true });
    await User.insertMany(normalizedUsers, { validateBeforeSave: false });
    console.log("Users imported:", normalizedUsers.length);

    // 2. Import messages first since conversations reference them
    const { normalizedData: normalizedMessages, idMap: messagesIdMap } =
      normalizeForMongo(messages);
    await Message.insertMany(normalizedMessages, { validateBeforeSave: false });
    console.log("Messages imported:", normalizedMessages.length);
    // 3. Import conversations with message references
    const combinedIdMap = new Map([...usersIdMap, ...messagesIdMap]);
    const { normalizedData: normalizedConversations } = normalizeForMongo(
      conversations,
      {
        idMap: combinedIdMap,
        convertMessageIds: true,
      }
    );
    await Conversation.insertMany(normalizedConversations, {
      validateBeforeSave: false,
    });
    console.log("Conversations imported:", normalizedConversations.length);

    console.log("✅ All data imported successfully");
  } catch (err) {
    console.error("❌ Import failed:", err.message);
  } finally {
    mongoose.disconnect();
  }
};

const deleteData = async () => {
  try {
    await Message.deleteMany();
    await Conversation.deleteMany();
    await User.deleteMany();
    console.log("Data deleted successfully");
  } catch (err) {
    console.error("Deletion error:", err);
  } finally {
    mongoose.disconnect();
  }
};

// CLI commands
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
} else {
  console.log('Use "--import" or "--delete" flag');
  process.exit();
}
