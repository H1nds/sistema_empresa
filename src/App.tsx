import { AppRouter } from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";

function App() {
    return (
        <AuthProvider>
            <div className="App">
                <AppRouter />
            </div>
        </AuthProvider>
    );
}

export default App;