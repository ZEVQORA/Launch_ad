import React from "react";
import { Composition } from "remotion";
import { LaunchFilm } from "./compositions/LaunchFilm";
import { VerticalTeaser } from "./compositions/VerticalTeaser";
import { FILM_FRAMES, FPS, TEASER_FRAMES } from "./config/timeline";

export const Root: React.FC = () => (
  <>
    <Composition id="LaunchFilm" component={LaunchFilm} width={1920} height={1080} fps={FPS} durationInFrames={FILM_FRAMES} />
    <Composition id="VerticalTeaser" component={VerticalTeaser} width={1080} height={1920} fps={FPS} durationInFrames={TEASER_FRAMES} />
  </>
);
