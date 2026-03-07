import React from "react";

const Skeleton = ({ width, height = "16px", borderRadius = "var(--radius-sm)", style = {} }) => (
  <div
    className="skeleton"
    style={{
      width: width || "100%",
      height,
      borderRadius,
      ...style,
    }}
  />
);

export default Skeleton;
