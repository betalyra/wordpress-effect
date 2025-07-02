import { Data } from "effect";
import { z } from "zod";

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
    rendered: z.string(),
  }),
  excerpt: z.object({
    rendered: z.string(),
  }),
  date: z.string(),
  modified: z.string().optional(),
  slug: z.string(),
  author: z.number().optional(),
  featured_media: z.number().optional(),
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
});

export const WpPageDetail = WpPageOverview.extend({
  date_gmt: z.string(),
  guid: z.object({
    rendered: z.string(),
  }),
  modified: z.string(),
  modified_gmt: z.string(),
  content: z.object({
    rendered: z.string(),
    protected: z.boolean(),
  }),
  author: z.number(),
  featured_media: z.number(),
  comment_status: z.string(),
  ping_status: z.string(),
  template: z.string(),
  meta: z.object({
    footnotes: z.string(),
  }),
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
});

export type WPPostOverview = z.infer<typeof WpPostOverview>;
export type WPPostDetail = z.infer<typeof WpPostDetail>;
export type WPPageOverview = z.infer<typeof WpPageOverview>;
export type WPPageDetail = z.infer<typeof WpPageDetail>;
export type WPCategory = z.infer<typeof WpCategory>;
export type WPTag = z.infer<typeof WpTag>;

export const WpStatus = z.enum(["draft", "publish"]);
export type WPStatus = z.infer<typeof WpStatus>;

export type LoadCategoriesProps = {
  category: string;
};

export type LoadTagsProps = {
  tag: string;
};

export type LoadPagesProps = {
  category: string;
  status?: WPStatus;
};

export type LoadPageDetailProps = {
  category: string;
  slug: string;
  status?: WPStatus;
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
