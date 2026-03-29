# Import all models for Base.metadata discovery
from db.base_class import Base
# Retired local User model - Discovery removed
from domain.orders.models import Order, OrderItem
from domain.products.models import Product
