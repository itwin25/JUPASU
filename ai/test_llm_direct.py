import asyncio
from app.services.taste.taste_report_service import generate_taste_report_summary

async def main():
    print("Starting direct LLM test...")
    try:
        res = await generate_taste_report_summary(
            nickname="TestUser",
            avg_sweetness=3.0,
            avg_acidity=3.0,
            avg_body=3.0,
            avg_tannin=3.0,
            avg_alcohol=12.0
        )
        print("Success:")
        print(res)
    except Exception as e:
        import traceback
        print("Caught Exception!")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
