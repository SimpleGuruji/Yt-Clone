import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || content?.trim() === "") {
    throw new ApiError(400, "tweet is required.");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating tweet.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, tweet, "Tweet created successfully."));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id.");
  }
  try {
    const tweet = await Tweet.aggregate([
      {
        $match: {
          owner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $group: {
          _id: "owner",
          tweets: { $push: "$content" },
        },
      },
      {
        $project: {
          _id: 0,
          tweets: 1,
        },
      },
    ]);
    if (!tweet || tweet.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "User have no tweets"));
    }
    return res
      .status(200)
      .json(
        new ApiResponse(200, tweet, "Tweet for the user fetched successfully!")
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Unable to fetch tweets");
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id.");
  }
  const { content } = req.body;

  if (!content || content?.trim() === "") {
    throw new ApiError(400, "tweet is required.");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      401,
      "You don't have the permission to update this tweet."
    );
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating the tweet.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully."));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id.");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (tweet.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(
      401,
      "You don't have the permission to delete this tweet."
    );
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(500, "Something went wrong while deleting the tweet.");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully."));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
