import { Config, Context, Effect, Layer, Redacted } from "effect";
import { HttpClient, HttpClientError } from "@effect/platform";
import { encode } from "js-base64";
import {
  LoadCategoriesProps,
  LoadTagsProps,
  LoadPagesProps,
  LoadPageDetailProps,
  LoadPostsOverviewProps,
  LoadPostDetailProps,
  WpPostOverview,
  WpPostDetail,
  WpPageDetail,
  WpCategory,
  WpTag,
  WordpressError,
  PostsOverviewResult,
  WPPostOverview,
  WPPostDetail,
  WPPageDetail,
  WPCategory,
  WPTag,
} from "./types.js";

export type ApiError = HttpClientError.HttpClientError | WordpressError;

export type IWordpressService = {
  loadCategories: (
    props: LoadCategoriesProps
  ) => Effect.Effect<WPCategory[], ApiError>;
  loadTags: (props: LoadTagsProps) => Effect.Effect<WPTag[], ApiError>;
  loadPagesOverview: (
    props: LoadPagesProps
  ) => Effect.Effect<WPPostOverview[], ApiError>;
  loadPageDetail: (
    props: LoadPageDetailProps
  ) => Effect.Effect<WPPageDetail[], ApiError>;
  loadPostsOverview: (
    props: LoadPostsOverviewProps
  ) => Effect.Effect<PostsOverviewResult, ApiError>;
  loadPostDetail: (
    props: LoadPostDetailProps
  ) => Effect.Effect<WPPostDetail[], ApiError>;
};

export class WordpressService extends Context.Tag("WordpressService")<
  WordpressService,
  IWordpressService
>() {}

export const WordpressServiceLayer = Layer.effect(
  WordpressService,
  Effect.gen(function* () {
    const WORDPRESS_API_URL = yield* Config.string("WORDPRESS_API_URL");
    const WORDPRESS_USERNAME = yield* Config.string("WORDPRESS_USERNAME");
    const WORDPRESS_PASSWORD = yield* Config.redacted("WORDPRESS_PASSWORD");
    const WORDPRESS_STATUS = yield* Config.string("WORDPRESS_STATUS");

    const WORDPRESS_API_KEY = Redacted.make(
      encode(`${WORDPRESS_USERNAME}:${WORDPRESS_PASSWORD}`)
    );

    const httpClient = yield* HttpClient.HttpClient;

    const loadCategories: IWordpressService["loadCategories"] = ({
      category,
    }) =>
      Effect.gen(function* () {
        yield* Effect.logDebug(`Fetching categories for ${category}`);
        const categoriesResponse = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/categories?slug=${category}`,
          {
            headers: {
              Authorization: `Basic ${WORDPRESS_API_KEY}`,
            },
          }
        );
        const categoriesJson = yield* categoriesResponse.json;
        yield* Effect.logDebug(categoriesJson);
        const categories = WpCategory.array().safeParse(categoriesJson);

        if (!categories.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch categories",
            })
          );
        }
        return categories.data;
      });

    const loadTags: IWordpressService["loadTags"] = ({ tag }) =>
      Effect.gen(function* () {
        yield* Effect.logDebug(`Fetching tags for ${tag}`);
        const tagsResponse = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/tags?slug=${tag}`,
          {
            headers: {
              Authorization: `Basic ${WORDPRESS_API_KEY}`,
            },
          }
        );
        const tagsJson = yield* tagsResponse.json;
        yield* Effect.logDebug(tagsJson);
        const tags = WpTag.array().safeParse(tagsJson);
        if (!tags.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch tags",
            })
          );
        }
        return tags.data;
      });

    const loadPagesOverview: IWordpressService["loadPagesOverview"] = ({
      category,
      status,
    }) =>
      Effect.gen(function* () {
        const pageStatus = status || WORDPRESS_STATUS;
        const categories = yield* loadCategories({ category });

        const retrievedCategory = categories.at(0);
        if (!retrievedCategory) {
          return [];
        }

        // Fetch all child pages
        const response = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?per_page=10&categories=${retrievedCategory.id}&fields=id,title,content,date,slug&status=${pageStatus}`,
          {
            headers: {
              Authorization: `Basic ${WORDPRESS_API_KEY}`,
            },
          }
        );

        const json = yield* response.json;
        yield* Effect.logDebug(json);
        const pages = WpPostOverview.array().safeParse(json);
        if (!pages.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch pages",
            })
          );
        }

        return pages.data;
      });

    const loadPageDetail: IWordpressService["loadPageDetail"] = ({
      category,
      slug,
      status,
    }) =>
      Effect.gen(function* () {
        const pageStatus = status || WORDPRESS_STATUS;
        yield* Effect.logDebug(`Fetching page detail for ${slug}`);
        const categories = yield* loadCategories({ category });
        if (categories.length === 0) {
          return [];
        }
        const retrievedCategory = categories[0];

        const response = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?slug=${slug}&fields=id,title,content,date,slug&status=${pageStatus}`,
          {
            headers: {
              Authorization: `Basic ${WORDPRESS_API_KEY}`,
            },
          }
        );
        const json = yield* response.json;
        const pages = WpPageDetail.array().safeParse(json);
        if (!pages.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch page detail",
            })
          );
        }
        return pages.data;
      });

    const loadPostsOverview: IWordpressService["loadPostsOverview"] = ({
      status,
      page = 1,
      per_page = 9,
      tags,
      categories,
    }) =>
      Effect.gen(function* () {
        const postStatus = status || WORDPRESS_STATUS;

        const searchParams = new URLSearchParams();
        searchParams.set("page", page.toString());
        searchParams.set("per_page", per_page.toString());
        searchParams.set("status", postStatus);
        searchParams.set("_embed", "true");

        if (tags) {
          searchParams.set("tags", tags.join(","));
        }

        if (categories) {
          searchParams.set("categories", categories.join(","));
        }

        const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);

        if (searchParams.size > 0) {
          url.search = searchParams.toString();
        }

        const response = yield* httpClient.get(url, {
          headers: {
            Authorization: `Basic ${WORDPRESS_API_KEY}`,
          },
        });

        const headers = response.headers;

        // Get total pages from headers
        const totalPages = parseInt(headers["X-WP-TotalPages"] ?? "1", 10);
        const totalPosts = parseInt(headers["X-WP-Total"] ?? "0", 10);

        const json = yield* response.json;
        yield* Effect.logDebug(json);
        const posts = WpPostOverview.array().safeParse(json);
        if (!posts.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch posts",
            })
          );
        }

        return {
          posts: posts.data,
          pagination: { totalPages, totalPosts, currentPage: page },
        };
      });

    const loadPostDetail: IWordpressService["loadPostDetail"] = ({
      status,
      slug,
      tags,
      categories,
    }) =>
      Effect.gen(function* () {
        const postStatus = status || WORDPRESS_STATUS;
        const searchParams = new URLSearchParams();
        searchParams.set("slug", slug);
        searchParams.set("status", postStatus);
        searchParams.set("_embed", "true");

        if (tags) {
          searchParams.set("tags", tags.join(","));
        }

        if (categories) {
          searchParams.set("categories", categories.join(","));
        }

        const url = new URL(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?${searchParams.toString()}`
        );
        const response = yield* httpClient.get(url, {
          headers: {
            Authorization: `Basic ${WORDPRESS_API_KEY}`,
          },
        });
        const json = yield* response.json;
        const posts = WpPostDetail.array().safeParse(json);
        if (!posts.success) {
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch post detail",
            })
          );
        }
        return posts.data;
      });

    return {
      loadCategories,
      loadTags,
      loadPagesOverview,
      loadPageDetail,
      loadPostsOverview,
      loadPostDetail,
    };
  })
);
