class CloudAuthService:
    @staticmethod
    def verify_cloud_provider_token(provider: str, id_token: str):
        return {"provider": provider, "verified": True}
