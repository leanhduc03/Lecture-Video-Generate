import { Spin } from "antd";
import { FC } from "react";
import "./loading.scss";

export const PageLoading: FC<{ loadingText?: string }> = ({ loadingText }) => {
  return (
    <div className="loading-container">
      <div style={{display: "flex", flexDirection: "column", gap: 2}}>
        <Spin></Spin>
        <span>{loadingText ?? "Đang tải trang..."}</span>
      </div>
    </div>
  );
};
export default PageLoading;