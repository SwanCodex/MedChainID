@echo off
REM ============================================
REM MedChainID Project Setup Script (Windows)
REM ============================================

echo =================================
echo 🏥 MedChainID Project Setup
echo =================================
echo.

REM ============================================
REM Check Prerequisites
REM ============================================

echo Checking prerequisites...
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed
    echo    Please install Node.js 18+ from https://nodejs.org/
    exit /b 1
)
node -v
echo ✅ Node.js installed
echo.

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm is not installed
    exit /b 1
)
npm -v
echo ✅ npm installed
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python is not installed
    echo    Please install Python 3.9+ from https://www.python.org/
    exit /b 1
)
python --version
echo ✅ Python installed
echo.

REM Check pip
where pip >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ pip is not installed
    exit /b 1
)
pip --version
echo ✅ pip installed
echo.

REM ============================================
REM Setup Backend
REM ============================================

echo =================================
echo 📦 Setting up Backend...
echo =================================
cd backend

echo Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    cd ..
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    
    echo Generating secure keys...
    for /f %%i in ('node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"') do set ENCRYPTION_KEY=%%i
    for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%i
    for /f %%i in ('node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"') do set SESSION_SECRET=%%i
    
    REM Update .env file
    powershell -Command "(gc .env) -replace 'ENCRYPTION_KEY=.*', 'ENCRYPTION_KEY=%ENCRYPTION_KEY%' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'JWT_SECRET=.*', 'JWT_SECRET=%JWT_SECRET%' | Out-File -encoding ASCII .env"
    powershell -Command "(gc .env) -replace 'SESSION_SECRET=.*', 'SESSION_SECRET=%SESSION_SECRET%' | Out-File -encoding ASCII .env"
    
    echo ✅ Backend .env created with generated keys
    echo ⚠️  Please update PINATA_API_KEY and PINATA_SECRET_API_KEY in backend\.env
    echo ⚠️  Please update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend\.env
) else (
    echo ⚠️  .env file already exists, skipping creation
)

cd ..
echo ✅ Backend setup complete
echo.

REM ============================================
REM Setup ML Engine
REM ============================================

echo =================================
echo 🤖 Setting up ML Engine...
echo =================================
cd ml-engine

echo Installing Python dependencies...
call pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install ML Engine dependencies
    cd ..
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo ✅ ML Engine .env created
    echo ⚠️  Please update GEMINI_API_KEY in ml-engine\.env
) else (
    echo ⚠️  .env file already exists, skipping creation
)

cd ..
echo ✅ ML Engine setup complete
echo.

REM ============================================
REM Setup Frontend
REM ============================================

echo =================================
echo 🎨 Setting up Frontend...
echo =================================
cd frontend

echo Installing Node.js dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    cd ..
    exit /b 1
)

REM Create .env if it doesn't exist
if not exist .env (
    echo Creating .env file...
    copy .env.example .env
    echo ✅ Frontend .env created
    echo ⚠️  Please update VITE_CONTRACT_ADDRESS in frontend\.env after deploying smart contract
) else (
    echo ⚠️  .env file already exists, skipping creation
)

cd ..
echo ✅ Frontend setup complete
echo.

REM ============================================
REM Check Aptos CLI
REM ============================================

echo =================================
echo ⛓️  Checking Aptos CLI...
echo =================================

where aptos >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    aptos --version
    echo ✅ Aptos CLI installed
    echo.
    echo To deploy the smart contract:
    echo   1. cd aptos-contract
    echo   2. aptos init --network devnet
    echo   3. aptos account fund-with-faucet --account YOUR_ADDRESS
    echo   4. aptos move compile
    echo   5. aptos move publish --named-addresses medchain=YOUR_ADDRESS
) else (
    echo ⚠️  Aptos CLI not installed
    echo    Install from: https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli
)

echo.

REM ============================================
REM Summary
REM ============================================

echo =================================
echo ✅ Setup Complete!
echo =================================
echo.
echo Next Steps:
echo.
echo 1. Configure API Keys:
echo    - Get Pinata API keys from https://app.pinata.cloud/
echo    - Set in backend\.env: PINATA_API_KEY and PINATA_SECRET_API_KEY
echo.
echo    - Get Gemini API key from https://makersuite.google.com/app/apikey
echo    - Set in ml-engine\.env: GEMINI_API_KEY
echo.
echo    - Get Google OAuth credentials from https://console.cloud.google.com/
echo    - Set in backend\.env: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
echo.
echo 2. Deploy Smart Contract:
echo    - Follow instructions above to deploy to Aptos
echo    - Update frontend\.env with VITE_CONTRACT_ADDRESS
echo.
echo 3. Start Services:
echo    - Backend:    cd backend ^&^& npm start
echo    - ML Engine:  cd ml-engine ^&^& python app.py
echo    - Frontend:   cd frontend ^&^& npm run dev
echo.
echo Happy coding! 🚀
echo.

pause
