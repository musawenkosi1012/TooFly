# Import all models for Base.metadata discovery
from db.base_class import Base
from domain.users.models import User
from domain.orders.models import Order, OrderItem
from domain.products.models import Product
from domain.designs.models import Design
