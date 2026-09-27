import proxy from "express-http-proxy"

export const proxyWithHeader = (serviceurl) => {
    return proxy(serviceurl, {
        proxyReqOptDecorator: (proxyReqOpts, srcReq) => {

            if (srcReq.user) {
                proxyReqOpts.headers["x-user-id"] = srcReq.user.userId
            }
            return proxyReqOpts
        }
    })
}