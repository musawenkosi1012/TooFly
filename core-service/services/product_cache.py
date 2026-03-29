import time

class ProductCache:
    _data = None
    _expiry = 0
    TTL = 60 # Seconds

    @classmethod
    def get(cls):
        if cls._data and time.time() < cls._expiry:
            return cls._data
        return None

    @classmethod
    def set(cls, data):
        cls._data = data
        cls._expiry = time.time() + cls.TTL

    @classmethod
    def invalidate(cls):
        cls._data = None

product_cache = ProductCache()
