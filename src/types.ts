import { Data } from "effect";
import { z } from "zod";

// SEO and Meta Data schemas
export const WpSeoMeta = z.object({
  // Basic SEO
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  canonical_url: z.string().optional(),
  robots: z.string().optional(), // noindex, nofollow, etc.

  // Open Graph
  og_title: z.string().optional(),
  og_description: z.string().optional(),
  og_image: z.string().optional(),
  og_image_alt: z.string().optional(),
  og_url: z.string().optional(),
  og_type: z.string().optional(),
  og_site_name: z.string().optional(),
  og_locale: z.string().optional(),

  // Twitter Cards
  twitter_card: z.string().optional(),
  twitter_title: z.string().optional(),
  twitter_description: z.string().optional(),
  twitter_image: z.string().optional(),
  twitter_image_alt: z.string().optional(),
  twitter_site: z.string().optional(),
  twitter_creator: z.string().optional(),

  // Schema.org structured data
  schema_type: z.string().optional(),
  schema_json: z.string().optional(),

  // Additional SEO fields
  focus_keyword: z.string().optional(),
  readability_score: z.number().optional(),
  seo_score: z.number().optional(),
  breadcrumbs: z
    .array(
      z.object({
        text: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});

export const WpPostOverview = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  excerpt: z.object({
    rendered: z.string(),
  }),
  date: z.string(),
  slug: z.string(),
  author: z.number().optional(),
  featured_media: z.number().optional(),
  // Add SEO meta fields
  seo_meta: WpSeoMeta.optional(),
  _embedded: z
    .object({
      author: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            url: z.string().optional(),
            description: z.string().optional(),
            avatar_urls: z.record(z.string(), z.string()).optional(),
          })
        )
        .optional(),
      "wp:featuredmedia": z
        .array(
          z.object({
            id: z.number(),
            source_url: z.string(),
            alt_text: z.string().optional(),
            // Add media meta for better SEO
            media_details: z
              .object({
                width: z.number().optional(),
                height: z.number().optional(),
                file: z.string().optional(),
                sizes: z
                  .record(
                    z.string(),
                    z.object({
                      file: z.string(),
                      width: z.number(),
                      height: z.number(),
                      source_url: z.string(),
                    })
                  )
                  .optional(),
              })
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const WpPostDetail = z.object({
  id: z.number(),
  title: z.object({
    rendered: z.string(),
  }),
  content: z.object({
    raw: z.string().optional(),
    rendered: z.string(),
  }),
  block_data: z.array(z.unknown()).optional(),
  has_blocks: z.boolean().optional(),
  excerpt: z.object({
    raw: z.string().optional(),
    rendered: z.string(),
  }),
  date: z.string(),
  modified: z.string().optional(),
  slug: z.string(),
  author: z.number().optional(),
  featured_media: z.number().optional(),
  // Add SEO meta fields
  seo_meta: WpSeoMeta.optional(),
  // Add estimated reading time
  reading_time: z.number().optional(),
  // Add word count
  word_count: z.number().optional(),
  _embedded: z
    .object({
      author: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            url: z.string().optional(),
            description: z.string().optional(),
            avatar_urls: z.record(z.string(), z.string()).optional(),
          })
        )
        .optional(),
      "wp:featuredmedia": z
        .array(
          z.object({
            id: z.number(),
            source_url: z.string(),
            alt_text: z.string().optional(),
            // Add media meta for better SEO
            media_details: z
              .object({
                width: z.number().optional(),
                height: z.number().optional(),
                file: z.string().optional(),
                sizes: z
                  .record(
                    z.string(),
                    z.object({
                      file: z.string(),
                      width: z.number(),
                      height: z.number(),
                      source_url: z.string(),
                    })
                  )
                  .optional(),
              })
              .optional(),
          })
        )
        .optional(),
    })
    .optional(),
});

export const WpPageOverview = z.object({
  id: z.number(),
  date: z.string(),
  slug: z.string(),
  status: z.string(),
  type: z.literal("page"),
  link: z.string(),
  title: z.object({
    rendered: z.string(),
  }),
  excerpt: z.object({
    rendered: z.string(),
    protected: z.boolean(),
  }),
  parent: z.number(),
  menu_order: z.number(),
  categories: z.array(z.number()),
  tags: z.array(z.number()),
  class_list: z.array(z.string()),
  // Add SEO meta fields
  seo_meta: WpSeoMeta.optional(),
});

export const WpPageDetail = WpPageOverview.extend({
  date_gmt: z.string(),
  guid: z.object({
    rendered: z.string(),
  }),
  modified: z.string(),
  modified_gmt: z.string(),
  content: z.object({
    raw: z.string().optional(),
    rendered: z.string(),
    protected: z.boolean(),
  }),
  has_blocks: z.boolean().optional(),
  block_data: z.array(z.unknown()).optional(),
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.string(),
  ping_status: z.string(),
  template: z.string(),
  meta: z.object({
    footnotes: z.string(),
  }),
  // Add SEO meta fields
  seo_meta: WpSeoMeta.optional(),
  // Add estimated reading time
  reading_time: z.number().optional(),
  // Add word count
  word_count: z.number().optional(),
});

export const WpCategory = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal("category"),
  parent: z.number(),
  meta: z.array(z.unknown()),
  // Add SEO meta fields for taxonomy terms
  seo_meta: WpSeoMeta.optional(),
});

export const WpTag = z.object({
  id: z.number(),
  count: z.number(),
  description: z.string(),
  link: z.string(),
  name: z.string(),
  slug: z.string(),
  taxonomy: z.literal("post_tag"),
  meta: z.array(z.unknown()),
  // Add SEO meta fields for taxonomy terms
  seo_meta: WpSeoMeta.optional(),
});

export type WPSeoMeta = {
  meta_title?: string;
  meta_description?: string;
  canonical_url?: string;
  robots?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  og_image_alt?: string;
  og_url?: string;
  og_type?: string;
  og_site_name?: string;
  og_locale?: string;
  twitter_card?: string;
  twitter_title?: string;
  twitter_description?: string;
  twitter_image?: string;
  twitter_image_alt?: string;
  twitter_site?: string;
  twitter_creator?: string;
  schema_type?: string;
  schema_json?: string;
  focus_keyword?: string;
  readability_score?: number;
  seo_score?: number;
  breadcrumbs?: Array<{
    text: string;
    url: string;
  }>;
};

export type WPPostOverview = {
  id: number;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
  };
  date: string;
  slug: string;
  author?: number;
  featured_media?: number;
  seo_meta?: WPSeoMeta;
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url?: string;
      description?: string;
      avatar_urls?: Record<string, string>;
    }>;
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      alt_text?: string;
      media_details?: {
        width?: number;
        height?: number;
        file?: string;
        sizes?: Record<string, {
          file: string;
          width: number;
          height: number;
          source_url: string;
        }>;
      };
    }>;
  };
};

export type WPPostDetail = {
  id: number;
  title: {
    rendered: string;
  };
  content: {
    raw?: string;
    rendered: string;
  };
  block_data?: unknown[];
  has_blocks?: boolean;
  excerpt: {
    raw?: string;
    rendered: string;
  };
  date: string;
  modified?: string;
  slug: string;
  author?: number;
  featured_media?: number;
  seo_meta?: WPSeoMeta;
  reading_time?: number;
  word_count?: number;
  _embedded?: {
    author?: Array<{
      id: number;
      name: string;
      url?: string;
      description?: string;
      avatar_urls?: Record<string, string>;
    }>;
    "wp:featuredmedia"?: Array<{
      id: number;
      source_url: string;
      alt_text?: string;
      media_details?: {
        width?: number;
        height?: number;
        file?: string;
        sizes?: Record<string, {
          file: string;
          width: number;
          height: number;
          source_url: string;
        }>;
      };
    }>;
  };
};

export type WPPageOverview = {
  id: number;
  date: string;
  slug: string;
  status: string;
  type: "page";
  link: string;
  title: {
    rendered: string;
  };
  excerpt: {
    rendered: string;
    protected: boolean;
  };
  parent: number;
  menu_order: number;
  categories: number[];
  tags: number[];
  class_list: string[];
  seo_meta?: WPSeoMeta;
};

export type WPPageDetail = WPPageOverview & {
  date_gmt: string;
  guid: {
    rendered: string;
  };
  modified: string;
  modified_gmt: string;
  content: {
    raw?: string;
    rendered: string;
    protected: boolean;
  };
  has_blocks?: boolean;
  block_data?: unknown[];
  author: number;
  featured_media: number;
  comment_status: string;
  ping_status: string;
  template: string;
  meta: {
    footnotes: string;
  };
  seo_meta?: WPSeoMeta;
  reading_time?: number;
  word_count?: number;
};

export type WPCategory = {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: "category";
  parent: number;
  meta: unknown[];
  seo_meta?: WPSeoMeta;
};

export type WPTag = {
  id: number;
  count: number;
  description: string;
  link: string;
  name: string;
  slug: string;
  taxonomy: "post_tag";
  meta: unknown[];
  seo_meta?: WPSeoMeta;
};

export const WpStatus = z.enum(["draft", "publish"]);
export type WPStatus = z.infer<typeof WpStatus>;

export type LoadCategoriesProps = {
  category: string;
};

export type LoadTagsProps = {
  tag: string;
};

export type LoadPagesProps = {
  status?: WPStatus;
  tagIds?: number[];
  categoryIds?: number[];
};

export type LoadPageDetailProps = {
  slug: string;
  status?: WPStatus;
  tagIds?: number[];
  categoryIds?: number[];
};

export type LoadPostsOverviewProps = {
  status?: WPStatus;
  page?: number;
  per_page?: number;
  tagIds?: number[];
  categoryIds?: number[];
};

export type LoadPostDetailProps = {
  status?: WPStatus;
  slug: string;
  tagIds?: number[];
  categoryIds?: number[];
};

export type PaginationInfo = {
  totalPages: number;
  totalPosts: number;
  currentPage: number;
};

export type PostsOverviewResult = {
  posts: WPPostOverview[];
  pagination: PaginationInfo;
};

export class WordpressError extends Data.TaggedError("WordpressError")<{
  message: string;
}> {}

export type LoadLlmsTxtResult = {
  llmsTxt: string;
};

// Additional SEO-related types
export type SeoAnalysis = {
  readability: {
    score: number;
    status: "good" | "ok" | "bad";
    issues: string[];
  };
  seo: {
    score: number;
    status: "good" | "ok" | "bad";
    issues: string[];
  };
  focus_keyword: {
    keyword: string;
    density: number;
    occurrences: number;
  };
};

export type SocialMediaPreview = {
  facebook: {
    title: string;
    description: string;
    image: string;
  };
  twitter: {
    title: string;
    description: string;
    image: string;
    card_type: "summary" | "summary_large_image";
  };
  linkedin: {
    title: string;
    description: string;
    image: string;
  };
};
