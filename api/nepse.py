import sys
import json
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import parse_qs, urlparse

from nepse_scraper import NepseScraper

sys.dont_write_bytecode = True

TTL_SECONDS = 60

_CACHE = {
    "by_key": {},
}

_ALLOWED_METHODS = {
    "call_endpoint",
    "get_all_securities",
    "get_brokers",
    "get_company_disclosures",
    "get_head_indices",
    "get_indices_history",
    "get_info_officers",
    "get_live_indices",
    "get_live_trades",
    "get_market_cap",
    "get_market_summary",
    "get_market_summary_history",
    "get_nepse_index",
    "get_news",
    "get_notices",
    "get_security_detail",
    "get_sector_detail",
    "get_sector_indices",
    "get_sectors",
    "get_sectorwise_summary",
    "get_securities_list",
    "get_security_daily_trade_stat",
    "get_supply_demand",
    "get_ticker_contact",
    "get_ticker_info",
    "get_ticker_price_history",
    "get_today_market_summary",
    "get_today_price",
    "get_top_by_trade_quantity",
    "get_top_gainer",
    "get_top_loser",
    "get_top_stocks",
    "get_top_trade",
    "get_top_transaction",
    "get_top_turnover",
    "get_trading_average",
    "is_market_open",
    "is_trading_day",
    "register_endpoint",
}


def _get_first(params, key):
    values = params.get(key)
    if not values:
        return None
    v = values[0]
    if v is None:
        return None
    v = str(v).strip()
    return v if v else None


def _to_float(value):
    if value is None:
        return None
    try:
        if isinstance(value, str):
            value = value.replace(",", "").strip()
        return float(value)
    except Exception:
        return None


def _to_int(value):
    f = _to_float(value)
    if f is None:
        return None
    try:
        return int(f)
    except Exception:
        return None


def _pick(d, keys):
    for k in keys:
        if k in d and d[k] is not None:
            return d[k]
    return None


def _normalize_record(rec):
    symbol = _pick(rec, ["symbol", "Symbol", "scrip", "Scrip"]) or ""
    symbol = str(symbol).strip().upper()

    ltp = _to_float(_pick(rec, ["ltp", "LTP", "lastTradedPrice", "last_price", "closePrice", "close"]))
    change = _to_float(_pick(rec, ["change", "Change", "pointChange", "point_change"]))
    pct_change = _to_float(_pick(rec, ["percentChange", "percentageChange", "percent_change", "PercentageChange"]))
    volume = _to_int(_pick(rec, ["volume", "Volume", "totalTradedQuantity", "total_quantity"]))

    open_price = _to_float(_pick(rec, ["open", "Open", "openPrice", "open_price"]))
    high = _to_float(_pick(rec, ["high", "High", "highPrice", "high_price"]))
    low = _to_float(_pick(rec, ["low", "Low", "lowPrice", "low_price"]))
    prev_close = _to_float(_pick(rec, ["previousClose", "previousClosePrice", "prevClose", "prev_close"]))

    security_name = _pick(rec, ["securityName", "security_name", "companyName", "company_name"])
    if security_name is not None:
        security_name = str(security_name).strip() or None

    item = {
        "symbol": symbol,
        "securityName": security_name,
        "ltp": ltp,
        "change": change,
        "percentChange": pct_change,
        "open": open_price,
        "high": high,
        "low": low,
        "previousClose": prev_close,
        "volume": volume,
    }

    return {k: v for k, v in item.items() if v is not None and v != ""}


def _normalize_candle(rec):
    if not isinstance(rec, dict):
        return None

    time_value = _pick(rec, ["time", "date", "businessDate", "tradeDate", "tradingDate", "dateString"])
    if time_value is None:
        time_value = _pick(rec, ["business_date", "trade_date"])
    if time_value is None:
        return None
    time_value = str(time_value).strip()
    if not time_value:
        return None

    open_price = _to_float(_pick(rec, ["open", "openPrice", "open_price"]))
    high = _to_float(_pick(rec, ["high", "highPrice", "high_price"]))
    low = _to_float(_pick(rec, ["low", "lowPrice", "low_price"]))
    close_price = _to_float(_pick(rec, ["close", "closePrice", "close_price", "ltp", "LTP"]))
    volume = _to_int(_pick(rec, ["volume", "totalTradedQuantity", "total_quantity"]))

    if open_price is None or high is None or low is None or close_price is None:
        return None
    if high < low:
        return None

    out = {"time": time_value, "open": open_price, "high": high, "low": low, "close": close_price}
    if volume is not None:
        out["volume"] = volume
    return out


def _fetch_today_prices():
    scraper = NepseScraper(verify_ssl=False)
    data = scraper.get_today_price()
    if not isinstance(data, list):
        return []
    items = []
    for rec in data:
        if isinstance(rec, dict):
            normalized = _normalize_record(rec)
            if normalized.get("symbol"):
                items.append(normalized)
    return items


def _cache_get(key):
    entry = _CACHE["by_key"].get(key)
    if not entry:
        return None
    now = time.time()
    if (now - float(entry.get("fetched_at", 0.0))) < TTL_SECONDS:
        return entry
    return None


def _cache_set(key, payload):
    _CACHE["by_key"][key] = {"fetched_at": time.time(), "payload": payload}


def _json_loads_or_none(value):
    if value is None:
        return None
    try:
        return json.loads(value)
    except Exception:
        return None


def _read_json_body(handler):
    length_header = handler.headers.get("Content-Length")
    if not length_header:
        return None
    try:
        length = int(length_header)
    except Exception:
        return None
    if length <= 0 or length > 1_000_000:
        return None
    raw = handler.rfile.read(length)
    if not raw:
        return None
    try:
        return json.loads(raw.decode("utf-8"))
    except Exception:
        return None


def _normalize_response_data(method, result):
    if method == "get_today_price":
        items = []
        if isinstance(result, list):
            for rec in result:
                if isinstance(rec, dict):
                    normalized = _normalize_record(rec)
                    if normalized.get("symbol"):
                        items.append(normalized)
        return {"items": items, "data": None}

    if method == "get_ticker_price_history":
        candles = []
        series = None
        if isinstance(result, (list, tuple)):
            series = result
        elif isinstance(result, dict):
            for key in ("content", "data", "items", "results", "result"):
                v = result.get(key)
                if isinstance(v, (list, tuple)):
                    series = v
                    break

        if isinstance(series, (list, tuple)):
            for rec in series:
                normalized = _normalize_candle(rec)
                if normalized is not None:
                    candles.append(normalized)
        return {"items": None, "data": candles}

    return {"items": None, "data": result}


def _resolve_method_from_legacy(endpoint):
    endpoint = (endpoint or "").strip().lower()
    mapping = {
        "today_price": "get_today_price",
        "market_open": "is_market_open",
        "ticker_info": "get_ticker_info",
        "indices_history": "get_indices_history",
        "market_summary": "get_market_summary",
        "market_summary_history": "get_market_summary_history",
        "sectorwise_summary": "get_sectorwise_summary",
        "securities_list": "get_securities_list",
        "security_daily_trade_stat": "get_security_daily_trade_stat",
        "supply_demand": "get_supply_demand",
        "broker": "get_brokers",
        "sectors": "get_sectors",
        "sector_indices": "get_sector_indices",
        "live_trades": "get_live_trades",
        "live_indices": "get_live_indices",
        "ticker_contact": "get_ticker_contact",
        "ticker_price_history": "get_ticker_price_history",
        "company_disclosures": "get_company_disclosures",
        "top_by_trade_quantity": "get_top_by_trade_quantity",
        "top_stocks": "get_top_stocks",
        "market_cap": "get_market_cap",
        "trading_average": "get_trading_average",
        "notices": "get_notices",
        "info_officers": "get_info_officers",
        "nepse_index": "get_nepse_index",
        "all_securities": "get_all_securities",
    }
    return mapping.get(endpoint)


def _default_args_kwargs_for_method(method, params):
    args = []
    kwargs = {}

    symbol = _get_first(params, "symbol")
    if symbol and method in {"get_ticker_info", "get_ticker_contact", "get_ticker_price_history", "get_security_detail"}:
        args = [str(symbol).strip().upper()]

    index_id = _get_first(params, "indexId") or _get_first(params, "index_id")
    if index_id and method in {"get_indices_history", "get_live_indices", "get_head_indices"}:
        kwargs["index_id"] = int(index_id)

    ticker = _get_first(params, "ticker")
    if ticker and method == "get_security_daily_trade_stat":
        args = [str(ticker).strip().upper()]

    sector = _get_first(params, "sector")
    if sector and method == "get_sector_detail":
        args = [str(sector)]

    category = _get_first(params, "category")
    if category and method == "get_top_stocks":
        args = [str(category)]

    show_all = _get_first(params, "show_all") or _get_first(params, "showAll")
    if show_all is not None and method in {"get_top_stocks", "get_top_by_trade_quantity", "get_supply_demand"}:
        kwargs["show_all"] = str(show_all).strip().lower() in {"1", "true", "yes", "y"}

    n_days = _get_first(params, "n_days") or _get_first(params, "nDays")
    if n_days is not None and method == "get_trading_average":
        try:
            kwargs["n_days"] = int(n_days)
        except Exception:
            pass

    business_date = _get_first(params, "business_date") or _get_first(params, "businessDate")
    if business_date:
        if method in {"get_today_price", "get_trading_average", "get_today_market_summary"}:
            kwargs["business_date"] = business_date

    start_date = _get_first(params, "start_date") or _get_first(params, "startDate")
    end_date = _get_first(params, "end_date") or _get_first(params, "endDate")
    if start_date:
        kwargs["start_date"] = start_date
    if end_date:
        kwargs["end_date"] = end_date

    return args, kwargs


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query or "")
            method = _get_first(params, "method") or _get_first(params, "op")
            endpoint = _get_first(params, "endpoint") or _get_first(params, "type")
            if not method and endpoint:
                method = _resolve_method_from_legacy(endpoint)
            method = (method or "get_today_price").strip()

            symbol = _get_first(params, "symbol")
            limit = _get_first(params, "limit")

            limit_n = None
            if limit is not None:
                try:
                    limit_n = max(1, min(500, int(limit)))
                except Exception:
                    limit_n = None

            if method not in _ALLOWED_METHODS:
                raise ValueError(f"Unsupported method: {method}")

            args = _json_loads_or_none(_get_first(params, "args"))
            kwargs = _json_loads_or_none(_get_first(params, "kwargs"))
            if args is None or kwargs is None:
                default_args, default_kwargs = _default_args_kwargs_for_method(method, params)
                if args is None:
                    args = default_args
                if kwargs is None:
                    kwargs = default_kwargs

            if not isinstance(args, list):
                raise ValueError("Invalid args: must be a JSON array")
            if not isinstance(kwargs, dict):
                raise ValueError("Invalid kwargs: must be a JSON object")

            cache_key = json.dumps({"method": method, "args": args, "kwargs": kwargs, "limit": limit_n, "symbol": symbol}, sort_keys=True, ensure_ascii=False)
            cached_entry = _cache_get(cache_key)
            if cached_entry:
                payload = cached_entry["payload"]
            else:
                scraper = NepseScraper(verify_ssl=False)
                fn = getattr(scraper, method)
                result = fn(*args, **kwargs)
                normalized = _normalize_response_data(method, result)
                items = normalized["items"]
                data = normalized["data"]

                if items is not None:
                    if symbol:
                        sym = str(symbol).strip().upper()
                        items = [x for x in items if str(x.get("symbol", "")).upper() == sym]
                    if limit_n is not None:
                        items = items[:limit_n]

                payload = {
                    "ok": True,
                    "source": "nepse-scraper",
                    "method": method,
                    "cached": False,
                    "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time())),
                    "ttlSeconds": TTL_SECONDS,
                    "count": len(items) if isinstance(items, list) else None,
                    "items": items,
                    "data": data,
                }
                _cache_set(cache_key, payload)

            payload["cached"] = bool(cached_entry)

            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", f"public, s-maxage={TTL_SECONDS}, stale-while-revalidate=300")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            payload = {"ok": False, "error": {"message": str(e), "type": e.__class__.__name__}}
            body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

    def do_POST(self):
        try:
            parsed = urlparse(self.path)
            params = parse_qs(parsed.query or "")
            body_json = _read_json_body(self) or {}

            method = body_json.get("method") or body_json.get("op") or _get_first(params, "method") or _get_first(params, "op")
            endpoint = body_json.get("endpoint") or body_json.get("type") or _get_first(params, "endpoint") or _get_first(params, "type")
            if not method and endpoint:
                method = _resolve_method_from_legacy(endpoint)
            method = (method or "get_today_price").strip()

            if method not in _ALLOWED_METHODS:
                raise ValueError(f"Unsupported method: {method}")

            args = body_json.get("args")
            kwargs = body_json.get("kwargs")
            if args is None or kwargs is None:
                default_args, default_kwargs = _default_args_kwargs_for_method(method, params)
                if args is None:
                    args = default_args
                if kwargs is None:
                    kwargs = default_kwargs

            if not isinstance(args, list):
                raise ValueError("Invalid args: must be an array")
            if not isinstance(kwargs, dict):
                raise ValueError("Invalid kwargs: must be an object")

            cache_key = json.dumps({"method": method, "args": args, "kwargs": kwargs}, sort_keys=True, ensure_ascii=False)
            cached_entry = _cache_get(cache_key)
            if cached_entry:
                payload = cached_entry["payload"]
            else:
                scraper = NepseScraper(verify_ssl=False)
                fn = getattr(scraper, method)
                result = fn(*args, **kwargs)
                normalized = _normalize_response_data(method, result)
                payload = {
                    "ok": True,
                    "source": "nepse-scraper",
                    "method": method,
                    "cached": False,
                    "fetchedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time())),
                    "ttlSeconds": TTL_SECONDS,
                    "count": len(normalized["items"]) if isinstance(normalized["items"], list) else None,
                    "items": normalized["items"],
                    "data": normalized["data"],
                }
                _cache_set(cache_key, payload)

            payload["cached"] = bool(cached_entry)

            out = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", f"public, s-maxage={TTL_SECONDS}, stale-while-revalidate=300")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)
        except Exception as e:
            payload = {"ok": False, "error": {"message": str(e), "type": e.__class__.__name__}}
            out = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(out)))
            self.end_headers()
            self.wfile.write(out)


def _run_dev_server(port):
    server = HTTPServer(("127.0.0.1", int(port)), handler)
    server.serve_forever()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8001)
    args = parser.parse_args()
    _run_dev_server(args.port)
