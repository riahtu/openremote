/*
 * Copyright 2017, OpenRemote Inc.
 *
 * See the CONTRIBUTORS.txt file in the distribution for a
 * full listing of individual contributors.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */
package org.openremote.model.security;

import jsinterop.annotations.JsType;
import org.openremote.model.Constants;
import org.openremote.model.http.RequestParams;
import org.openremote.model.http.SuccessStatusCode;

import javax.annotation.security.RolesAllowed;
import javax.validation.Valid;
import javax.ws.rs.*;

import static javax.ws.rs.core.MediaType.APPLICATION_JSON;

/**
 * Manage users in realms and get info of current user.
 */
// TODO Relax permissions to allow regular users to maintain their own realm
@Path("user")
@JsType(isNative = true)
public interface UserResource {

    @GET
    @Path("{realm}/roles")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(200)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    Role[] getRoles(@BeanParam RequestParams requestParams, @PathParam("realm") String realm);

    @PUT
    @Path("{realm}/roles")
    @Consumes(APPLICATION_JSON)
    @SuccessStatusCode(204)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    void updateRoles(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, Role[] roles);

    @GET
    @Produces(APPLICATION_JSON)
    @Path("{realm}/users")
    @SuccessStatusCode(200)
    @SuppressWarnings("unusable-by-js")
    User[] getAll(@BeanParam RequestParams requestParams, @PathParam("realm") String realm);

    @GET
    @Path("{realm}/{userId}")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(200)
    @SuppressWarnings("unusable-by-js")
    User get(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId);

    @GET
    @Path("user")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(200)
    @SuppressWarnings("unusable-by-js")
    User getCurrent(@BeanParam RequestParams requestParams);

    @PUT
    @Path("{realm}/users/{userId}")
    @Consumes(APPLICATION_JSON)
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(204)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    void update(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId, @Valid User user);

    @POST
    @Path("{realm}/users")
    @Consumes(APPLICATION_JSON)
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(204)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    User create(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @Valid User user);

    @DELETE
    @Path("{realm}/users/{userId}")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(204)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    void delete(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId);

    @PUT
    @Path("{realm}/reset-password/{userId}")
    @SuccessStatusCode(204)
    @Consumes(APPLICATION_JSON)
    @Produces(APPLICATION_JSON)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    void resetPassword(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId, Credential credential);

    @GET
    @Path("{realm}/userRoles/{userId}")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(200)
    @SuppressWarnings("unusable-by-js")
    Role[] getUserRoles(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId);

    @GET
    @Path("userRoles")
    @Produces(APPLICATION_JSON)
    @SuccessStatusCode(200)
    @SuppressWarnings("unusable-by-js")
    Role[] getCurrentUserRoles(@BeanParam RequestParams requestParams);

    @PUT
    @Path("{realm}/userRoles/{userId}")
    @Consumes(APPLICATION_JSON)
    @SuccessStatusCode(204)
    @RolesAllowed(Constants.WRITE_ADMIN_ROLE)
    @SuppressWarnings("unusable-by-js")
    void updateUserRoles(@BeanParam RequestParams requestParams, @PathParam("realm") String realm, @PathParam("userId") String userId, Role[] roles);
}
