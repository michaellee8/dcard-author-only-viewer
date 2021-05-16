import { https, logger } from "firebase-functions";
import express = require("express");

import fetch, { Response } from "node-fetch";

const cors = require("cors")({
  origin: [
    "https://dcard-author-only-viewer.web.app",
    "https://dcard-author-only-viewer.firebaseapp.com",
  ],
});

const matchers: RegExp[] = [
  /^(\d+)$/,
  /https:\/\/[\w\.]+\.dcard.tw\/f\/[\w]+\/p\/(\d+)/,
];

async function getAllAuthorCommentsByPost(
  req: https.Request,
  res: express.Response<Array<{ floor: number; content: string }>>
) {
  if (typeof req.body.searchInput !== "string") {
    logger.info(`handled client error: invalid input: ${req.body.searchInput}`);
    res.sendStatus(400);
    return;
  }
  const searchInput = req.body.searchInput as string;
  let postId: string | null = null;
  for (const mat of matchers) {
    const m = mat.exec(searchInput);
    if (m === null) {
      continue;
    }
    postId = m[1];
  }
  if (postId === null) {
    logger.info(
      `handled client error: no postId found in input: ${req.body.searchInput}`
    );
    res.sendStatus(400);
    return;
  }

  // test if such post exist and can be fetched
  try {
    const testRes = await fetch(
      `https://www.dcard.tw/service/api/v2/posts/${postId}`
    );
    if (!testRes.ok) {
      logger.info(`handled client error: post not found for postId: ${postId}`);
      res.sendStatus(404);
    }
  } catch (err) {
    logger.error(
      `unhandled server error: cannot fetch post: ${postId}: error ${err}`
    );
    console.error(err);
    res.sendStatus(500);
  }

  // fetch all comments, filter out those written by author, and combine them
  let done = false;
  let after = 0;
  const limit = 100;
  let authorComments: Array<{ floor: number; content: string }> = [];
  while (!done) {
    let commentRes: Response;
    try {
      commentRes = await fetch(
        `https://www.dcard.tw/service/api/v2/posts/${postId}/comments?limit=${limit}&after=${after}`
      );
      if (!commentRes.ok) {
        logger.error(
          `unhandled server error: comments not found for postId: ${postId}`
        );
        res.sendStatus(500);
        return;
      }
    } catch (err) {
      logger.error(
        `unhendled server error: cannot fetch comments: ${postId}: error ${err}`
      );
      console.error(err);
      res.sendStatus(500);
      return;
    }

    after += limit;
    const currentComments: Array<{
      floor: number;
      content: string;
      host: boolean;
    }> = await commentRes.json();
    if (currentComments.length <= 0) {
      done = true;
      continue;
    }
    currentComments.forEach((comm) => {
      if (!comm.host) {
        return;
      }
      authorComments.push({ floor: comm.floor, content: comm.content });
    });
  }
  logger.info(
    `service log: post ${postId} fetch success, ${authorComments.length} comments fetched`
  );
  res.json(authorComments);
  return;
}

exports.getAllAuthorCommentsByPost = https.onRequest((req, res) => {
  return cors(req, res, () => {
    getAllAuthorCommentsByPost(req, res);
  });
});
