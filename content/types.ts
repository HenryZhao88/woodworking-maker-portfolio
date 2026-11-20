export type ImageRole = "process" | "overall" | "detail" | "feature";

export interface ProjectImage {
  src: string;
  alt: string;
  role: ImageRole;
  /** Real pixel size of the file — layouts size frames from these, never crop the subject. */
  width: number;
  height: number;
  caption?: string;
}

export interface ProcessStage {
  label: string;
  caption: string;
  images: ProjectImage[];
}

export interface TextBlock {
  heading: string;
  body: string[];
}

export interface Project {
  slug: string;
  title: string;
  navLabel: string;
  status: "published" | "placeholder";
  about?: TextBlock & { image: ProjectImage };
  process?: { heading: string; intro: string; stages: ProcessStage[] };
  favorite?: TextBlock & { image: ProjectImage };
  challenging?: TextBlock & { image: ProjectImage };
  finished?: { overall: ProjectImage[]; details: ProjectImage[] };
  impression?: TextBlock;
}
