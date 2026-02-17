import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      const path = req.nextUrl.pathname;

      // Admin routes require ADMIN or STAFF role
      if (path.startsWith("/admin")) {
        return token?.role === "ADMIN" || token?.role === "STAFF";
      }

      // Protected customer routes require any authenticated user
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/cart",
    "/checkout",
    "/orders/:path*",
    "/profile",
  ],
};
