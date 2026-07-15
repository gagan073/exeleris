import { Navigate } from "react-router-dom";

const FindWork = () => {
  return <Navigate to="/auth?mode=signup&type=expert" replace />;
};

export default FindWork;
