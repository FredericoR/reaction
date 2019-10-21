import Random from "@reactioncommerce/random";
import ReactionError from "@reactioncommerce/reaction-error";
import getSlug from "@reactioncommerce/api-utils/getSlug.js";
import { Category as CategorySchema } from "../simpleSchemas.js"; // TODO: update schemas

/**
 * @name Mutation.addCategory
 * @method
 * @memberof Routes/GraphQL
 * @summary Add a category
 * @param {Object} context -  an object containing the per-request state
 * @param {Object} input - mutation input
 * @returns {Promise<Object>} AddCategoryPayload
 */
export default async function addCategory(context, input) {
  // Check for owner or admin permissions from the user before allowing the mutation
  const { shopId, name, isVisible, displayTitle, metafields, heroMediaUrl, slug: slugInput } = input;
  const { appEvents, collections, userHasPermission } = context;
  const { Categories } = collections;

  if (!userHasPermission(["owner", "admin"], shopId)) {
    throw new ReactionError("access-denied", "User does not have permission");
  }

  let slug = name;
  if (typeof slugInput === "string" && slugInput.trim().length > 0) {
    slug = slugInput;
  }

  const now = new Date();
  const category = {
    _id: Random.id(),
    isDeleted: false,
    isTopLevel: false,
    isVisible,
    slug: getSlug(slug),
    metafields,
    name,
    displayTitle,
    heroMediaUrl,
    shopId,
    createdAt: now,
    updatedAt: now
  };

  CategorySchema.validate(category);

  try {
    const { result } = await Categories.insertOne(category);

    if (result.ok !== 1) {
      throw new ReactionError("server-error", "Unable to create category");
    }

    await appEvents.emit("afterCategoryCreate", category);

    return category;
  } catch ({ message }) {
    // Mongo duplicate key error.
    if (message.includes("E11000") && message.includes("slug")) {
      throw new ReactionError("error", `Slug ${category.slug} is already in use`);
    }

    throw new ReactionError("error", message);
  }
}
