/**
 * @name category
 * @method
 * @memberof Category/category
 * @summary query the Categories collection and return a category by category ID or slug
 * @param {Object} context - an object containing the per-request state
 * @param {String} slugOrId - ID or slug of category to query
 * @param {Boolean} [params.shouldIncludeInvisible] - Whether or not to include `isVisible=true` categories. Default is `false`
 * @returns {Object} - A Category document if one was found
 */
export default async function category(context, slugOrId, { shouldIncludeInvisible = false } = {}) {
  const { collections, userHasPermission } = context;
  const { Categories } = collections;
  let query = {
    $and: [
      { isVisible: true },
      { $or: [{ _id: slugOrId }, { slug: slugOrId }] }
    ]
  };

  if (shouldIncludeInvisible === true) {
    const shopId = await context.queries.primaryShopId(context);
    if (userHasPermission(["owner", "admin"], shopId)) {
      query = {
        $and: [
          { isVisible: { $in: [false, true] } },
          { $or: [{ _id: slugOrId }, { slug: slugOrId }] }
        ]
      };
    }
  }

  return Categories.findOne(query);
}
