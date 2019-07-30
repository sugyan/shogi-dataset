import { labels } from "./piece";

export type NumbersResponse = {
    [label in labels]: number;
};

export interface ImageResponse {
    id: string;
    image_url: string;
    label: string;
    created_at: string;
    updated_at: string;
}

export interface ImagesResponse {
    images: ImageResponse[];
    cursor: string;
}
