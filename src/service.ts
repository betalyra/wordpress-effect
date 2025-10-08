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
  LoadLlmsTxtResult,
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
  loadLlmsTxt: Effect.Effect<LoadLlmsTxtResult, ApiError>;
};

export class WordpressService extends Context.Tag("WordpressService")<
  WordpressService,
  IWordpressService
>() {}

// Helper function to build comprehensive search parameters for SEO data
const buildSeoSearchParams = (baseParams: URLSearchParams): URLSearchParams => {
  // Include embedded data for authors and featured media
  baseParams.set("_embed", "true");

  // Include meta fields for SEO plugins (Yoast, RankMath, etc.)
  baseParams.set(
    "meta_key",
    "_yoast_wpseo_metadesc,_yoast_wpseo_title,_yoast_wpseo_canonical,_yoast_wpseo_meta-robots-noindex,_yoast_wpseo_meta-robots-nofollow,_yoast_wpseo_opengraph-title,_yoast_wpseo_opengraph-description,_yoast_wpseo_opengraph-image,_yoast_wpseo_twitter-title,_yoast_wpseo_twitter-description,_yoast_wpseo_twitter-image,_rank_math_title,_rank_math_description,_rank_math_canonical_url,_rank_math_robots,_rank_math_facebook_title,_rank_math_facebook_description,_rank_math_facebook_image,_rank_math_twitter_title,_rank_math_twitter_description,_rank_math_twitter_image"
  );

  // Include additional fields that might contain SEO data
  baseParams.set(
    "_fields",
    "id,date,date_gmt,guid,modified,modified_gmt,slug,status,type,link,title,content,excerpt,author,featured_media,comment_status,ping_status,sticky,template,format,meta,categories,tags,class_list,_links,_embedded"
  );

  return baseParams;
};

export const WordpressServiceLayer = Layer.effect(
  WordpressService,
  Effect.gen(function* () {
    const WORDPRESS_API_URL = yield* Config.url("WORDPRESS_API_URL");
    const WORDPRESS_USERNAME = yield* Config.string("WORDPRESS_USERNAME");
    const WORDPRESS_PASSWORD = yield* Config.redacted("WORDPRESS_PASSWORD");
    const WORDPRESS_STATUS = yield* Config.string("WORDPRESS_STATUS");

    if (
      WORDPRESS_USERNAME.valueOf() === "" ||
      Redacted.value(WORDPRESS_PASSWORD) === ""
    ) {
      return yield* Effect.fail(
        new WordpressError({
          message: "WORDPRESS_USERNAME or WORDPRESS_PASSWORD is not set",
        })
      );
    }

    const WORDPRESS_API_KEY = Redacted.make(
      encode(`${WORDPRESS_USERNAME}:${Redacted.value(WORDPRESS_PASSWORD)}`)
    );

    const httpClient = yield* HttpClient.HttpClient;

    const loadCategories: IWordpressService["loadCategories"] = ({
      category,
    }) =>
      Effect.gen(function* () {
        yield* Effect.logDebug(`Fetching categories for ${category}`);

        const searchParams = new URLSearchParams();
        searchParams.set("slug", category);
        // Include meta fields for taxonomy SEO
        searchParams.set(
          "_fields",
          "id,count,description,link,name,slug,taxonomy,parent,meta"
        );

        const categoriesResponse = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/categories?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
            },
          }
        );
        const categoriesJson = yield* categoriesResponse.json;
        yield* Effect.logDebug(categoriesJson);
        const categories = WpCategory.array().safeParse(categoriesJson);

        if (!categories.success) {
          yield* Effect.logError(categories.error);
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

        const searchParams = new URLSearchParams();
        searchParams.set("slug", tag);
        // Include meta fields for taxonomy SEO
        searchParams.set(
          "_fields",
          "id,count,description,link,name,slug,taxonomy,meta"
        );

        const tagsResponse = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/tags?${searchParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
            },
          }
        );
        const tagsJson = yield* tagsResponse.json;
        yield* Effect.logDebug(tagsJson);
        const tags = WpTag.array().safeParse(tagsJson);
        if (!tags.success) {
          yield* Effect.logError(tags.error);
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch tags",
            })
          );
        }
        return tags.data;
      });

    const loadPagesOverview: IWordpressService["loadPagesOverview"] = ({
      categoryIds,
      status,
    }) =>
      Effect.gen(function* () {
        const pageStatus = status || WORDPRESS_STATUS;

        const searchParams = new URLSearchParams();
        searchParams.set("per_page", "10");
        searchParams.set("status", pageStatus);

        if (categoryIds) {
          searchParams.set("categories", categoryIds.join(","));
        }

        // Add comprehensive SEO parameters
        const seoParams = buildSeoSearchParams(searchParams);

        const response = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?${seoParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
            },
          }
        );

        const json = yield* response.json;
        yield* Effect.logDebug(json);
        const pages = WpPostOverview.array().safeParse(json);
        if (!pages.success) {
          yield* Effect.logError(pages.error);
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch pages",
            })
          );
        }

        return pages.data;
      });

    const loadPageDetail: IWordpressService["loadPageDetail"] = ({
      categoryIds,
      slug,
      status,
    }) =>
      Effect.gen(function* () {
        const pageStatus = status || WORDPRESS_STATUS;
        yield* Effect.logDebug(`Fetching page detail for ${slug}`);

        const searchParams = new URLSearchParams();
        searchParams.set("slug", slug);
        searchParams.set("status", pageStatus);

        if (categoryIds) {
          searchParams.set("categories", categoryIds.join(","));
        }

        // Add comprehensive SEO parameters
        const seoParams = buildSeoSearchParams(searchParams);

        const response = yield* httpClient.get(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/pages?${seoParams.toString()}`,
          {
            headers: {
              Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
            },
          }
        );
        const json = yield* response.json;
        const pages = WpPageDetail.array().safeParse(json);
        if (!pages.success) {
          yield* Effect.logError(pages.error);
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
      tagIds,
      categoryIds,
    }) =>
      Effect.gen(function* () {
        const postStatus = status || WORDPRESS_STATUS;

        const searchParams = new URLSearchParams();
        searchParams.set("page", page.toString());
        searchParams.set("per_page", per_page.toString());
        searchParams.set("status", postStatus);

        if (tagIds) {
          searchParams.set("tags", tagIds.join(","));
        }

        if (categoryIds) {
          searchParams.set("categories", categoryIds.join(","));
        }

        // Add comprehensive SEO parameters
        const seoParams = buildSeoSearchParams(searchParams);

        const url = new URL(`${WORDPRESS_API_URL}/wp-json/wp/v2/posts`);
        url.search = seoParams.toString();

        yield* Effect.logDebug("Requesting posts overview", {
          url: url.toString(),
        });
        const response = yield* httpClient.get(url, {
          headers: {
            Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
          },
        });

        const headers = response.headers;

        // Get total pages from headers
        const totalPages = parseInt(headers["X-WP-TotalPages"] ?? "1", 10);
        const totalPosts = parseInt(headers["X-WP-Total"] ?? "0", 10);

        if (response.status !== 200) {
          yield* Effect.logError("Failed to fetch posts", {
            status: response.status,
          });
          const error = yield* response.text;
          yield* Effect.logError(error);
          return yield* Effect.fail(
            new WordpressError({ message: "Failed to fetch posts" })
          );
        }

        const json = yield* response.json;
        yield* Effect.logDebug(json);
        const posts = WpPostOverview.array().safeParse(json);
        if (!posts.success) {
          yield* Effect.logError(posts.error);
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
      tagIds,
      categoryIds,
    }) =>
      Effect.gen(function* () {
        const postStatus = status || WORDPRESS_STATUS;
        const searchParams = new URLSearchParams();
        searchParams.set("slug", slug);
        searchParams.set("status", postStatus);
        // Request edit context to get raw content (Gutenberg blocks)
        searchParams.set("context", "edit");

        if (tagIds) {
          searchParams.set("tags", tagIds.join(","));
        }

        if (categoryIds) {
          searchParams.set("categories", categoryIds.join(","));
        }

        // Add comprehensive SEO parameters
        const seoParams = buildSeoSearchParams(searchParams);

        const url = new URL(
          `${WORDPRESS_API_URL}/wp-json/wp/v2/posts?${seoParams.toString()}`
        );
        yield* Effect.logDebug("Requesting post detail", {
          url: url.toString(),
        });
        const response = yield* httpClient.get(url, {
          headers: {
            Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
          },
        });
        if (response.status !== 200) {
          yield* Effect.logError("Failed to fetch post detail", {
            status: response.status,
          });
          const text = yield* response.text;
          yield* Effect.logError(text);
          return yield* Effect.fail(
            new WordpressError({ message: "Failed to fetch post detail" })
          );
        }
        const json = yield* response.json;
        const posts = WpPostDetail.array().safeParse(json);
        if (!posts.success) {
          yield* Effect.logError(posts.error);
          return yield* Effect.fail(
            new WordpressError({
              message: "Failed to fetch post detail",
            })
          );
        }
        return posts.data;
      });

    const loadLlmsTxt: IWordpressService["loadLlmsTxt"] = Effect.gen(
      function* () {
        const response = yield* httpClient.get(
          `${WORDPRESS_API_URL}/llms.txt`,
          {
            headers: {
              Authorization: `Basic ${Redacted.value(WORDPRESS_API_KEY)}`,
            },
          }
        );
        const llmsTxt = yield* response.text;
        return { llmsTxt };
      }
    );

    return {
      loadCategories,
      loadTags,
      loadPagesOverview,
      loadPageDetail,
      loadPostsOverview,
      loadPostDetail,
      loadLlmsTxt,
    };
  })
);
