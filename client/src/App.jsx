import { RequiredFieldEnhancer } from "./components/common/RequiredFieldEnhancer.jsx";
import { AppRouter } from "./routes/AppRouter.jsx";

export default function App() {
  return (
    <>
      <RequiredFieldEnhancer />
      <AppRouter />
    </>
  );
}
