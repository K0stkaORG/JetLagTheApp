import { Redirect, Slot } from "expo-router";

import { useAuth } from "~/context/auth";

const Layout = () => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) return <Redirect href="/login" />;

    return <Slot />;
};

export default Layout;
