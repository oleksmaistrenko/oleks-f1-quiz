import React from "react";

const CheckingOverlay = ({ message = "We are checking...", subtext = "" }) => {
  return (
    <div className="checking-overlay">
      <div className="checking-spinner"></div>
      <div className="checking-text">{message}</div>
      {subtext && <div className="checking-subtext">{subtext}</div>}
    </div>
  );
};

export default CheckingOverlay;
