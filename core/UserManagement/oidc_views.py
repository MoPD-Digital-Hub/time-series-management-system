from urllib.parse import urlencode

from django.conf import settings
from django.contrib import messages
from django.http import HttpResponseRedirect
from django.shortcuts import resolve_url
from mozilla_django_oidc.views import OIDCAuthenticationCallbackView


class CustomOIDCAuthenticationCallbackView(OIDCAuthenticationCallbackView):
    """
    On OIDC login failure due to unknown TSMS user, force logout from OP session
    and return user to local login page with an error message.
    """

    def login_failure(self):
        missing_user = self.request.session.pop("oidc_user_not_found", None)
        if not missing_user:
            return super().login_failure()

        messages.error(
            self.request,
            f"User '{missing_user}' was not found in the Time Series system. Please contact your administrator."
        )

        logout_endpoint = getattr(settings, "OIDC_OP_LOGOUT_ENDPOINT", "")
        if not logout_endpoint:
            return HttpResponseRedirect(resolve_url(settings.LOGIN_URL))

        login_redirect = getattr(
            settings,
            "OIDC_POST_LOGOUT_REDIRECT_URI",
            self.request.build_absolute_uri(resolve_url(settings.LOGIN_URL)),
        )
        params = {
            "client_id": settings.OIDC_RP_CLIENT_ID,
            "post_logout_redirect_uri": login_redirect,
        }

        oidc_id_token = self.request.session.get("oidc_id_token")
        if oidc_id_token:
            params["id_token_hint"] = oidc_id_token

        return HttpResponseRedirect(f"{logout_endpoint}?{urlencode(params)}")
