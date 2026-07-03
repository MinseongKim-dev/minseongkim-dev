from repositories.base_repo import BaseRepository

_REGISTRY: dict[str, BaseRepository] = {}


def get_repository(prefix: str) -> BaseRepository:
    if prefix not in _REGISTRY:
        _REGISTRY[prefix] = BaseRepository(prefix)
    return _REGISTRY[prefix]
