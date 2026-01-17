# Time Series Management System (TSMS)

A comprehensive Django-based web application for managing time-series data, indicators, KPIs, and performance metrics. The system is designed to support Ethiopian calendar dates and provides multi-language support (English/Amharic) for data management, visualization, and reporting.

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Database Models](#database-models)
- [Contributing](#contributing)

## ✨ Features

### Core Functionality
- **Indicator Management**: Create, manage, and track KPIs and performance indicators
- **Time-Series Data**: Support for monthly, quarterly, and annual data collection
- **Ethiopian Calendar Support**: Native support for Ethiopian calendar dates with automatic conversion
- **Multi-Language**: English and Amharic language support
- **Data Import/Export**: Excel and CSV import/export capabilities
- **Dashboard Visualization**: Customizable dashboards with charts, graphs, and tables
- **Mobile API**: RESTful API endpoints for mobile applications
- **User Management**: Role-based access control with category managers and data importers
- **Data Verification**: Workflow for data submission and verification
- **Regional Data**: Support for regional data tracking across Ethiopian regions

### Key Capabilities
- Performance vs Target tracking
- Year-over-year comparison (1, 5, 10 years)
- KPI characteristics (increasing, decreasing, constant, volatile)
- Indicator hierarchy (parent-child relationships)
- Document management
- Project initiatives tracking
- Trending indicators
- High-frequency data tracking (daily/weekly)

## 🛠 Technology Stack

- **Backend Framework**: Django 4.2.6
- **API**: Django REST Framework 3.15.2
- **Database**: SQLite3 (development), configurable for production
- **Python Version**: >=3.9, <4.0
- **Package Management**: Poetry
- **Additional Libraries**:
  - `django-import-export`: Data import/export functionality
  - `pillow`: Image processing
  - `openpyxl`: Excel file handling
  - `python-decouple`: Environment configuration
  - `django-cors-headers`: CORS support
  - `py-ethiopian-date-converter`: Ethiopian calendar conversion
  - `uwsgi`: Production server

## 📁 Project Structure

```
time-series-management-system/
├── core/                          # Main Django project directory
│   ├── Base/                      # Core application
│   │   ├── models.py             # Core data models (Indicators, DataPoints, etc.)
│   │   ├── api/                  # REST API views and serializers
│   │   ├── views.py              # Web views
│   │   └── admin.py              # Django admin configuration
│   ├── UserManagement/           # User management app
│   │   ├── models.py             # CustomUser, roles, permissions
│   │   └── api/                  # User API endpoints
│   ├── DashBoard/                # Dashboard application
│   │   ├── models.py             # Dashboard components and layouts
│   │   └── views.py              # Dashboard views
│   ├── DataPortal/               # Public data portal
│   ├── mobile/                   # Mobile API endpoints
│   │   └── api/                  # Mobile-specific API views
│   ├── UserAdmin/                # User administration
│   ├── mediaManager/             # Media file management
│   ├── project/                  # Django project settings
│   │   ├── settings.py           # Application settings
│   │   ├── urls.py               # Root URL configuration
│   │   └── wsgi.py               # WSGI configuration
│   ├── templates/                # HTML templates
│   ├── static/                   # Static files (CSS, JS, images)
│   ├── media/                    # User-uploaded media files
│   └── manage.py                 # Django management script
├── pyproject.toml                # Poetry dependencies
├── poetry.lock                   # Locked dependencies
└── README.md                     # This file
```

## 🚀 Installation

### Prerequisites

- Python 3.9 or higher
- Poetry (for dependency management)
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd time-series-management-system
   ```

2. **Install Poetry** (if not already installed)
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

3. **Install dependencies**
   ```bash
   poetry install
   ```

4. **Activate the virtual environment**
   ```bash
   poetry shell
   ```

5. **Create environment file**
   ```bash
   cp .env.example .env  # Create .env file if needed
   ```

6. **Run migrations**
   ```bash
   cd core
   python manage.py migrate
   ```

7. **Create superuser** (optional)
   ```bash
   python manage.py createsuperuser
   ```

8. **Collect static files**
   ```bash
   python manage.py collectstatic --noinput
   ```

9. **Run development server**
   ```bash
   python manage.py runserver
   ```

The application will be available at `http://127.0.0.1:8000/`

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the project root with the following variables:

```env
DJANGO_ENV=development  # or 'production'
SECRET_KEY=your-secret-key-here
```

### Settings

Key configuration files:
- `core/project/settings.py`: Main Django settings
- `core/uwsgi.ini`: Production server configuration

### Database Configuration

By default, the project uses SQLite3. For production, update `DATABASES` in `settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### Media and Static Files

- **Development**: Media and static files are stored in `core/media/` and `core/static/`
- **Production**: Configure paths in `settings.py`:
  ```python
  MEDIA_ROOT = '/mnt/data/tsms-public/media/'
  STATIC_ROOT = '/mnt/data/tsms-public/static/'
  ```

## 📖 Usage

### Admin Interface

Access the Django admin panel at `/admin/` to manage:
- Indicators and KPIs
- Categories and Topics
- Data points (Annual, Quarterly, Monthly)
- Users and permissions
- Dashboard components
- Documents and media

### Main Applications

1. **Base Application** (`/`)
   - Indicator management
   - Data entry and viewing
   - Category and topic management

2. **Dashboard** (`/dashboard/`)
   - Customizable dashboards
   - Data visualization
   - Performance tracking

3. **Data Portal** (`/data-portal/`)
   - Public-facing data portal
   - Data exploration
   - Indicator details

4. **User Management** (`/user-management/`)
   - User registration and login
   - Role management
   - Category assignments

5. **Mobile API** (`/api/mobile/`)
   - RESTful endpoints for mobile apps
   - Dashboard overview
   - High-frequency data

## 🔌 API Endpoints

### Mobile API (`/api/mobile/`)

- Dashboard overview endpoints
- Indicator data endpoints
- High-frequency data endpoints

### REST Framework (`/api-auth/`)

- DRF browsable API
- Authentication endpoints
- Custom API views in `Base/api/`

## 🗄️ Database Models

### Core Models (Base App)

- **Topic**: Main topics/themes for organizing indicators
- **Category**: Categories for grouping indicators
- **Indicator**: Core KPI/indicator model with metadata
- **DataPoint**: Year representation (Ethiopian and Gregorian)
- **AnnualData**: Annual performance and target data
- **QuarterData**: Quarterly performance and target data
- **MonthData**: Monthly performance and target data
- **KPIRecord**: Daily/weekly KPI records with aggregation
- **Document**: File documents associated with topics/categories
- **ProjectInitiatives**: Project and initiative tracking

### User Models (UserManagement App)

- **CustomUser**: Extended user model with roles
- **ResponsibleEntity**: Ministries/organizations
- **CategoryAssignment**: Manager-category relationships
- **IndicatorSubmission**: Indicator submission workflow
- **DataSubmission**: Data submission workflow

### Dashboard Models (DashBoard App)

- **Dashboard**: Dashboard container
- **Row**: Dashboard row layout
- **DashboardIndicator**: Indicator components in dashboards
- **Component**: Reusable dashboard components

### Mobile Models (mobile App)

- **MobileDahboardOverview**: Mobile dashboard configuration
- **HighFrequency**: High-frequency data visualization config

## 👥 User Roles

- **Superuser**: Full system access
- **Category Manager**: Manages specific categories and their data
- **Data Importer**: Can import data for assigned categories
- **Dashboard User**: Can view dashboards
- **Regular User**: Basic access

## 📊 Data Types and Frequencies

### Supported Frequencies
- **Annual**: Yearly data points
- **Quarterly**: Quarterly data (4 quarters per year)
- **Monthly**: Monthly data (12 months per year)
- **Biannual**: Semi-annual data
- **Daily/Weekly**: High-frequency data via KPIRecord

### Data Types
- **Number**: Integer values
- **Decimal**: Decimal/float values
- **Percentage**: Percentage values

### KPI Characteristics
- **Increasing**: Higher values are better
- **Decreasing**: Lower values are better
- **Constant**: Stable values expected
- **Volatile**: Variable values expected

## 🔄 Data Import/Export

The system supports importing data from Excel and CSV files. Sample templates are available in `core/static/sample_excel/`:
- `SampleIndicatorFormat.xlsx`
- `SampleTopicFormat.xlsx`
- `SampleYearFormat.xlsx`

## 🌍 Ethiopian Calendar Support

The system includes native support for Ethiopian calendar dates:
- Automatic conversion between Ethiopian and Gregorian calendars
- Year representation in both formats (e.g., 2016 EC = 2023/2024 GC)
- Date calculations for Ethiopian months and quarters

## 🧪 Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Creating a New App
```bash
python manage.py startapp app_name
```

## 🚢 Production Deployment

### Using uWSGI

The project includes `uwsgi.ini` configuration. To deploy:

```bash
uwsgi --ini uwsgi.ini
```

### Environment Setup

Set `DJANGO_ENV=production` in your environment variables for production settings.

## 📝 License

[Specify your license here]

## 👤 Author

**Mikiyas**
- Email: mikiyas.m.degefu@gmail.com

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or contributions, please open an issue on the repository.

---

**Note**: This system is designed for managing time-series data with a focus on Ethiopian calendar dates and multi-language support. Ensure proper configuration of environment variables and database settings before deployment.
