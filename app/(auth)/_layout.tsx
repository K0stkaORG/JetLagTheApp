import { Redirect, Slot } from "expo-router";

import { useAuth } from "~/context/auth";

const Layout = () => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) return <Redirect href="/" />;

    return <Slot />;
};

export default Layout;
